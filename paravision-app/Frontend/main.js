const { app, BrowserWindow } = require('electron');

let win;
function createWindow() {
  win = new BrowserWindow({
    width: 1024,
    height: 600,
    resizable: false,
    maximizable: false,
    minimizable: true,
    frame: true,
    fullscreen: true,
    title: 'ParaVision',
    webPreferences: {
      zoomFactor: 1.0,
      nodeIntegration: true, // Keep if needed, else use contextIsolation + preload
    },
  });

  const isProd = process.env.NODE_ENV === 'production';
  win.loadURL(isProd 
    ? `file://${__dirname}/build/index.html` 
    : 'http://localhost:3000');

  if (!isProd) win.webContents.openDevTools();

  win.on('closed', () => win = null);
}

app.on('ready', createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
