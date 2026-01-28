const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs/promises');

let win;

const DATA_DIR = path.join(__dirname, 'data');
const TESTS_DB = path.join(DATA_DIR, 'tests.json');

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

function createWindow() {
  win = new BrowserWindow({
    fullscreen: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      enableRemoteModule: false
    }
  });

  const isProd = process.env.NODE_ENV === 'production';
  if (isProd) {
    win.loadFile(path.join(__dirname, 'build/index.html'));
  } else {
    win.loadURL('http://localhost:3001'); // Your React dev server
  }

  win.on('closed', () => (win = null));
}

// ---------- IPC HANDLERS ----------
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

ipcMain.handle('openMalariaTest', async (_e, testData) => {
  if (win) win.webContents.send('navigate-to-malaria', testData);
  return { success: true };
});

ipcMain.handle('openStoolTest', async (_e, testData) => {
  if (win) win.webContents.send('navigate-to-stool', testData);
  return { success: true };
});

ipcMain.handle('openBothTest', async (_e, testData) => {
  if (win) win.webContents.send('navigate-to-both', testData);
  return { success: true };
});

// ---------- GPIO CONTROL (NEW & CRITICAL) ----------
ipcMain.handle('set-gpio', async (_event, payload) => {
  try {
    const response = await fetch('http://localhost:8000/gpio/set', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`FastAPI error ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to control GPIO via FastAPI:', error);
    throw error;
  }
});

// ---------- PRINTING ----------
ipcMain.handle('print-result', async (_event, htmlContent) => {
  try {
    const printWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        offscreen: true,
        contextIsolation: true,
        sandbox: true
      }
    });

    await printWindow.loadURL(
      'data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent)
    );

    printWindow.webContents.on('did-finish-load', () => {
      printWindow.webContents.print({ silent: false }, (success, errorType) => {
        if (!success) console.error('Print Failed:', errorType);
        printWindow.close();
      });
    });

    return { success: true };
  } catch (err) {
    console.error('Print error:', err);
    return { success: false, error: err.message };
  }
});

// ---------- APP INIT ----------
app.whenReady().then(async () => {
  await ensureFiles();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});