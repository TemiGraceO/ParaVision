const { app, BrowserWindow } = require('electron');
const path = require('path');
let win;

function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false // TEMP DEBUG (remove later for security!)
    }
  });

  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:3000');
    win.webContents.openDevTools(); // Keep DevTools open
  } else {
    win.loadFile(path.join(__dirname, 'build/index.html'));
  }

  // Log load failures
  win.webContents.on('did-fail-load', (e, code, desc) => {
    console.error(`LOAD FAILED: ${code} - ${desc}`);
  });

  // Handle unresponsive window
  win.on('unresponsive', () => {
    console.warn('Window unresponsive!');
  });

  // Cleanup on close
  win.on('closed', () => {
    win = null;
  });
}

app.on('ready', createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
  if (win === null) createWindow();
});

// **Security Note:**
// - Remove `webSecurity: false` in prod!
// - Add CSP in `public/index.html`:
//   <meta http-equiv="Content-Security-Policy" content="script-src 'self'">
