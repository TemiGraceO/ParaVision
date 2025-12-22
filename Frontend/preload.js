const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // ---------- Image & Test handlers ----------
  saveImage: (data) => ipcRenderer.invoke('save-image', data),
  getImages: () => ipcRenderer.invoke('get-images'),
  saveTest: (test) => ipcRenderer.invoke('save-test', test),
  getTests: () => ipcRenderer.invoke('get-tests'),

  // ---------- YOLO Detection ----------
  startDetection: () => ipcRenderer.invoke('start-detection'),
  stopDetection: () => ipcRenderer.invoke('stop-detection'),
  onDetectionUpdate: (callback) =>
    ipcRenderer.on('detection-update', (_event, data) => callback(data)),
  removeDetectionListener: () =>
    ipcRenderer.removeAllListeners('detection-update'),

  // ---------- NEW: Frame sharing (1 line added) ----------
  detectFrame: (frameData) => ipcRenderer.invoke('detect-frame', frameData),

  // ---------- New: Live image updates ----------
  onImageSaved: (callback) =>
    ipcRenderer.on('image-saved', (_event, data) => callback(data)),
});
