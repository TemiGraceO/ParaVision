const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true, // careful with security!
      contextIsolation: false,
    },
  });

  // Dev vs Prod
  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:3000'); // React dev server
    win.webContents.openDevTools(); // debug
  } else {
    win.loadFile(path.join(__dirname, 'build/index.html')); // prod build
  }
}

app.on('ready', createWindow);
app.on('window-all-closed', () => (process.platform !== 'darwin' && app.quit()));
app.on('activate', () => win === null && createWindow());
