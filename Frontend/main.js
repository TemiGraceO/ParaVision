const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs/promises');
const { spawn } = require('child_process'); // ? FIXED typo

let win;
let pythonProcess = null;

// ---------- PATHS ----------
const DATA_DIR = path.join(__dirname, 'data');
const TESTS_DB = path.join(DATA_DIR, 'tests.json');

// ---------- HELPERS ----------
async function ensureFiles() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(TESTS_DB);
  } catch {
    await fs.writeFile(TESTS_DB, JSON.stringify([]));
  }
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
      sandbox: false,
      enableRemoteModule: false
    },
  });

  const isProd = process.env.NODE_ENV === 'production';
  if (isProd) {
    win.loadFile(path.join(__dirname, 'build', 'index.html'));
  } else {
    win.loadURL('http://localhost:3001');
  }

  win.webContents.on('did-finish-load', () => {
    win.webContents.openDevTools({ mode: 'detach' });
  });

  win.webContents.on('console-message', (_e, level, message) => {
    console.log(`[RENDERER ${level}]: ${message}`);
  });

  win.on('closed', () => (win = null));
}

// ---------- TEST HANDLERS ----------
ipcMain.handle('save-test', async (_e, test) => {
  await ensureFiles();
  const tests = await readJSON(TESTS_DB);
  tests.push(test);
  await writeJSON(TESTS_DB, tests);
  return { success: true };
});

ipcMain.handle('get-tests', async () => {
  await ensureFiles();
  return await readJSON(TESTS_DB);
});

// ---------- NAVIGATION HANDLERS ----------
ipcMain.handle('openMalariaTest', async (_event, testData) => {
  win.webContents.send('navigate-to-malaria', testData);
  return { success: true };
});

ipcMain.handle('openStoolTest', async (_event, testData) => {
  win.webContents.send('navigate-to-stool', testData);
  return { success: true };
});

ipcMain.handle('openBothTest', async (_event, testData) => {
  win.webContents.send('navigate-to-both', testData);
  return { success: true };
});

// ---------- HEALTH CHECK ----------
ipcMain.handle('health-check', async () => {
  try {
    const res = await fetch("http://127.0.0.1:8000/api/health");
    return await res.json();
  } catch (e) {
    return { status: "offline", error: e.message };
  }
});

// ---------- APP ----------
app.whenReady().then(async () => {
  await ensureFiles();
  createWindow();

  // START PYTHON BACKEND (unchanged behavior)
  pythonProcess = spawn("python", ["main.py"], {
    cwd: path.join(__dirname, "python"),
    stdio: "inherit"
  });
});

app.on('window-all-closed', () => {
  if (pythonProcess) pythonProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});
