const { app, BrowserWindow } = require('electron');
let win;

function createWindow() {
  win = new BrowserWindow({ width: 1024,height: 600,resizable: false,maximizable: false, minimizable: true,frame: true, fullscreen:false, title: 'ParaVision',webPreferences: {
    nodeIntegration: true,
  }});
  win.loadURL('http://localhost:3000');
  win.webContents.openDevTools();
}

app.on('ready', createWindow);