const { contextBridge, ipcRenderer } = require('electron');
const { exec } = require('child_process');
const fs = require('fs');
const { promisify } = require('util');

const execAsync = promisify(exec);
const readFileAsync = promisify(fs.readFile);
const unlinkAsync = promisify(fs.unlink);

contextBridge.exposeInMainWorld('electronAPI', {
  // ---------- SAVE / GET TESTS ----------
  saveTest: (test) => ipcRenderer.invoke('save-test', test),
  getTests: () => ipcRenderer.invoke('get-tests'),

  // ---------- NAVIGATION ----------
  openMalariaTest: (testData) => ipcRenderer.invoke('openMalariaTest', testData),
  openStoolTest: (testData) => ipcRenderer.invoke('openStoolTest', testData),
  openBothTest: (testData) => ipcRenderer.invoke('openBothTest', testData),

  onNavigateToMalaria: (callback) =>
    ipcRenderer.on('navigate-to-malaria', (_e, data) => callback(data)),
  onNavigateToStool: (callback) =>
    ipcRenderer.on('navigate-to-stool', (_e, data) => callback(data)),
  onNavigateToBoth: (callback) =>
    ipcRenderer.on('navigate-to-both', (_e, data) => callback(data)),

  // ---------- CAMERA ----------
  testCamera: async () => {
    try {
      const devices = await execAsync('ls /dev/video* 2>/dev/null || echo "none"');
      if (!devices.stdout.includes('/dev/video')) {
        return { success: false, error: "No camera detected" };
      }

      const v4l = await execAsync('v4l2-ctl --list-devices 2>/dev/null || true');
      return { success: true, devices: devices.stdout, v4l2: v4l.stdout };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  captureFrame: async () => {
    const framePath = `/tmp/frame_${Date.now()}.jpg`;
    try {
      const commands = [
        `fswebcam -d /dev/video0 --resolution 640x480 --jpeg 85 -S 10 ${framePath}`,
        `ffmpeg -f v4l2 -i /dev/video0 -vframes 1 -y ${framePath}`,
      ];

      let captured = false;
      for (const cmd of commands) {
        try {
          await execAsync(cmd);
          if (fs.existsSync(framePath)) { captured = true; break; }
        } catch {}
      }

      if (!captured) throw new Error("Camera capture failed");

      const data = await readFileAsync(framePath);
      await unlinkAsync(framePath);

      return { success: true, image: data.toString("base64"), size: data.length };
    } catch (e) {
      try { await unlinkAsync(framePath); } catch {}
      return { success: false, error: e.message };
    }
  },

  // ---------- PYTORCH DETECTION ----------
  detectMalaria: async (imageBase64) => {
    const { spawn } = require('child_process');
    return new Promise((resolve) => {
      const py = spawn('python3', ['python/detect.py'], { cwd: __dirname });

      let data = '';
      py.stdout.on('data', (chunk) => { data += chunk.toString(); });
      py.stderr.on('data', (err) => console.error(err.toString()));

      py.on('close', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { resolve({ success: false, error: e.message }); }
      });

      py.stdin.write(JSON.stringify({ image: imageBase64 }) + '\n');
      py.stdin.end();
    });
  }
});
