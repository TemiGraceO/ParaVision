const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const fs = require('fs/promises');
const { spawn } = require('child_process');

let win;
let yoloProcess = null;
let detectionListeners = [];

// ---------- PATHS ----------
const DATA_DIR = path.join(__dirname, 'data');
const IMAGE_DIR = path.join(__dirname, 'images');
const IMAGES_DB = path.join(DATA_DIR, 'images.json');
const TESTS_DB = path.join(DATA_DIR, 'tests.json');
const PYTHON_SCRIPT = path.join(__dirname, 'python/live_detection.py');

// ---------- HELPERS ----------
async function ensureFiles() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(IMAGE_DIR, { recursive: true });

  try { await fs.access(IMAGES_DB); } catch { await fs.writeFile(IMAGES_DB, JSON.stringify([])); }
  try { await fs.access(TESTS_DB); } catch { await fs.writeFile(TESTS_DB, JSON.stringify([])); }
}

async function readJSON(file) {
  return JSON.parse(await fs.readFile(file, 'utf-8'));
}

async function writeJSON(file, data) {
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

// ---------- CREATE WINDOW ----------
function createWindow() {
  win = new BrowserWindow({
    fullscreen: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      autoplayPolicy: 'no-user-gesture-required',
    },
  });

  const isProd = process.env.NODE_ENV === 'production';
  if (isProd) win.loadFile(path.join(__dirname, 'build', 'index.html'));
  else win.loadURL('http://localhost:3000');

  // AUTO DEVTOOLS
  win.webContents.on('did-finish-load', () => {
    win.webContents.openDevTools({ mode: 'detach' });
  });

  // LOG RENDERER CONSOLE
  win.webContents.on('console-message', (event, level, message) => {
    console.log(`[RENDERER ${level}]: ${message}`);
  });

  // Camera & media permissions
  session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
    if (permission === 'media') callback(true);
    else callback(false);
  });

  win.on('closed', () => (win = null));
}

// ---------- YOLO STREAMING HANDLERS (UNCHANGED) ----------
ipcMain.handle('start-detection', async () => {
  console.log('Starting YOLO detection...');
  
  if (yoloProcess && !yoloProcess.killed) {
    console.log('Killing existing YOLO process...');
    yoloProcess.kill('SIGTERM');
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  try {
    await fs.access(PYTHON_SCRIPT);
    
    yoloProcess = spawn('python3', [PYTHON_SCRIPT], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    yoloProcess.stdout.on('data', (data) => {
      try {
        const line = data.toString().trim();
        if (line) {
          const parsed = JSON.parse(line);
          win?.webContents.send('detection-update', parsed);
          detectionListeners.forEach(cb => cb(parsed));
        }
      } catch (err) {
        console.error('YOLO JSON parse error:', err.message);
      }
    });

    yoloProcess.stderr.on('data', (data) => {
      const error = data.toString().trim();
      console.error('YOLO stderr:', error);
      const errorData = { status: 'Error', error: error, boxes: [], timestamp: Date.now() };
      win?.webContents.send('detection-update', errorData);
    });

    yoloProcess.on('close', (code, signal) => {
      console.log(`YOLO process closed with code ${code}, signal ${signal}`);
      yoloProcess = null;
      win?.webContents.send('detection-update', { 
        status: 'Stopped', 
        boxes: [], 
        timestamp: Date.now() 
      });
    });

    return { success: true, status: 'Started' };
  } catch (err) {
    console.error('Failed to start YOLO:', err);
    win?.webContents.send('detection-update', { 
      status: 'Failed', 
      error: err.message, 
      boxes: [] 
    });
    return { success: false, error: err.message };
  }
});

ipcMain.handle('stop-detection', async () => {
  if (yoloProcess && !yoloProcess.killed) {
    console.log('Stopping YOLO detection...');
    yoloProcess.kill('SIGTERM');
  }
  detectionListeners = [];
  return { success: true };
});
// ?? REAL PYTHON MODEL (REPLACE test boxes)
ipcMain.handle('detect-frame', async (event, frameData) => {
  console.log('?? detect-frame called - REAL PYTHON');
  
  return new Promise((resolve) => {
    let pythonProcess;
    
    try {
      pythonProcess = spawn('python3', [PYTHON_SCRIPT]);
      
      // Send frame to Python
      pythonProcess.stdin.write(frameData + '\n');
      pythonProcess.stdin.end();
      
      let output = '';
      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      pythonProcess.on('close', (code) => {
        try {
          const result = JSON.parse(output.trim());
          console.log('?? REAL MODEL:', result);
          resolve(result);
        } catch (e) {
          console.error('Python parse error:', e);
          resolve({ status: 'success', boxes: [] });
        }
      });
      
    } catch (e) {
      resolve({ status: 'error', boxes: [] });
    }
  });
});

// ---------- IMAGE & TEST HANDLERS ----------
ipcMain.handle('save-image', async (_e, { testId, type, dataURL }) => {
  await ensureFiles();
  const folder = path.join(IMAGE_DIR, type);
  await fs.mkdir(folder, { recursive: true });
  const filename = `img_${Date.now()}.png`;
  const filepath = path.join(folder, filename);
  const base64 = dataURL.replace(/^data:image\/png;base64,/, '');
  await fs.writeFile(filepath, Buffer.from(base64, 'base64'));

  const images = await readJSON(IMAGES_DB);
  const imageEntry = { testId, type, path: filepath, createdAt: new Date().toISOString() };
  images.push(imageEntry);
  await writeJSON(IMAGES_DB, images);
  if (win) win.webContents.send('image-saved', imageEntry);
  return { success: true, path: filepath };
});

ipcMain.handle('get-images', async () => await readJSON(IMAGES_DB));
ipcMain.handle('save-test', async (_e, test) => {
  await ensureFiles();
  const tests = await readJSON(TESTS_DB);
  tests.push(test);
  await writeJSON(TESTS_DB, tests);
  return { success: true };
});
ipcMain.handle('get-tests', async () => await readJSON(TESTS_DB));

// ---------- APP ----------
app.whenReady().then(async () => {
  await ensureFiles();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
