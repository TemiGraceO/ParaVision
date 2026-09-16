const { contextBridge, ipcRenderer } = require('electron');
const { exec } = require('child_process');
const fs = require('fs');
const { promisify } = require('util');

const execAsync = promisify(exec);
const readFileAsync = promisify(fs.readFile);
const unlinkAsync = promisify(fs.unlink);

contextBridge.exposeInMainWorld('electronAPI', {
  // Test management
  saveTest: (test) => ipcRenderer.invoke('save-test', test),
  getTests: () => ipcRenderer.invoke('get-tests'),

  // Navigation
  openMalariaTest: (testData) => ipcRenderer.invoke('openMalariaTest', testData),
  openStoolTest: (testData) => ipcRenderer.invoke('openStoolTest', testData),
  openBothTest: (testData) => ipcRenderer.invoke('openBothTest', testData),

  onNavigateToMalaria: (callback) =>
    ipcRenderer.on('navigate-to-malaria', (_e, data) => callback(data)),
  onNavigateToStool: (callback) =>
    ipcRenderer.on('navigate-to-stool', (_e, data) => callback(data)),
  onNavigateToBoth: (callback) =>
    ipcRenderer.on('navigate-to-both', (_e, data) => callback(data)),
  
  // ? NEW: GPIO Control
  setGPIO: (data) => ipcRenderer.invoke('set-gpio', data),

  // Detection (FastAPI)
  detectFrame: async (imageBase64) => {
    try {
      const response = await fetch(imageBase64);
      const blob = await response.blob();
      const formData = new FormData();
      formData.append('file', blob, 'frame.jpg');
      const res = await fetch('http://localhost:8000/detect', { 
        method: 'POST', 
        body: formData 
      });
      if (!res.ok) throw new Error(res.statusText);
      return await res.json();
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  detectFrameStool: async (imageBase64) => {
    try {
      const response = await fetch(imageBase64);
      const blob = await response.blob();
      const formData = new FormData();
      formData.append('file', blob, 'frame.jpg');
      const res = await fetch('http://localhost:8000/detect_stool', { 
        method: 'POST', 
        body: formData 
      });
      if (!res.ok) throw new Error(res.statusText);
      return await res.json();
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Camera capture
  captureBloodFrame: async () => {
    const framePath = `/tmp/blood_frame_${Date.now()}.jpg`;
    try {
      await execAsync(
        `ffmpeg -loglevel error -f v4l2 -video_size 640x480 -i /dev/video0 -frames:v 1 -q:v 5 -y ${framePath}`
      );
      const data = await readFileAsync(framePath);
      await unlinkAsync(framePath);
      return { 
        success: true, 
        dataUrl: `data:image/jpeg;base64,${data.toString('base64')}` 
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  captureStoolFrame: async () => {
    const framePath = `/tmp/stool_frame_${Date.now()}.jpg`;
    try {
      await execAsync(
        `ffmpeg -loglevel error -f v4l2 -video_size 640x480 -i /dev/video2 -frames:v 1 -q:v 5 -y ${framePath}`
      );
      const data = await readFileAsync(framePath);
      await unlinkAsync(framePath);
      return { 
        success: true, 
        dataUrl: `data:image/jpeg;base64,${data.toString('base64')}` 
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  // Printing
  printResult: (htmlContent) => ipcRenderer.invoke('print-result', htmlContent)
});