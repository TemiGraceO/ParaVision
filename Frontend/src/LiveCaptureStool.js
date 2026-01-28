import React, { useEffect, useRef, useState } from 'react';
import './LiveCaptureStool.css';

const INTERVAL = 500;

export default function LiveCaptureStool({ visible, onClose, onDetection, currentCounts }) {
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);

  // Keep track of parasites that have ever been detected
  const [persistentCounts, setPersistentCounts] = useState({
    Hookworm: currentCounts?.Hookworm || 0,
    Ascaris: currentCounts?.Ascaris || 0,
    Trichuris: currentCounts?.Trichuris || 0
  });

  useEffect(() => {
    // Initialize persistent counts when modal opens
    if (visible) {
      setPersistentCounts(prev => ({
        Hookworm: currentCounts?.Hookworm || prev.Hookworm,
        Ascaris: currentCounts?.Ascaris || prev.Ascaris,
        Trichuris: currentCounts?.Trichuris || prev.Trichuris
      }));
    }
  }, [visible, currentCounts]);

  useEffect(() => {
    if (!visible) {
      clearInterval(intervalRef.current);
      return;
    }

    const captureLoop = async () => {
      try {
        const frame = await window.electronAPI.captureStoolFrame();
        if (!frame?.success) return;

        const img = new Image();
        img.onload = async () => {
          const canvas = canvasRef.current;
          if (!canvas) return;

          const ctx = canvas.getContext('2d');

          // **Canvas size**
          canvas.width = 1280;
          canvas.height = 720;

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const result = await window.electronAPI.detectFrameStool(
            canvas.toDataURL('image/jpeg')
          );
          if (!result?.boxes) return;

          const scaleX = canvas.width / 224;
          const scaleY = canvas.height / 224;

          const newPersistentCounts = { ...persistentCounts };

          result.boxes.forEach(box => {
            const name = box.class_name;
            if (name && newPersistentCounts[name] !== undefined) {
              newPersistentCounts[name] = "Present"; // once detected, always Present
            }

            if (box.confidence > 0.4) {
              const x = box.x1 * scaleX;
              const y = box.y1 * scaleY;
              const w = (box.x2 - box.x1) * scaleX;
              const h = (box.y2 - box.y1) * scaleY;

              ctx.strokeStyle = '#00c48c';
              ctx.lineWidth = 3;
              ctx.strokeRect(x, y, w, h);

              const label = `${name} ${Math.round(box.confidence * 100)}%`;
              ctx.font = 'bold 18px Arial';
              const metrics = ctx.measureText(label);

              ctx.fillStyle = 'rgba(0,196,140,0.9)';
              ctx.fillRect(x, Math.max(0, y - 28), metrics.width + 12, 28);

              ctx.fillStyle = 'white';
              ctx.fillText(label, x + 6, Math.max(4, y - 10));
            }
          });

          setPersistentCounts(newPersistentCounts);
          onDetection?.(newPersistentCounts);
        };

        img.src = frame.dataUrl;
      } catch (err) {
        console.error('Stool capture error:', err);
      }
    };

    captureLoop();
    intervalRef.current = setInterval(captureLoop, INTERVAL);

    return () => clearInterval(intervalRef.current);
  }, [visible, onDetection, persistentCounts]);

  return (
    <div className={`live-overlay ${visible ? 'show' : ''}`}>
      <div className="live-modal stool-live-modal">
        <div className="live-header">
          <h2>Live Stool Detection</h2>
          <button className="close-x" onClick={onClose}>x</button>
        </div>

        <div className="camera-wrapper">
          <canvas ref={canvasRef} />
          <div className="counts-overlay">
            H: {persistentCounts.Hookworm === "Present" ? "Present" : 0} |
            A: {persistentCounts.Ascaris === "Present" ? "Present" : 0} |
            T: {persistentCounts.Trichuris === "Present" ? "Present" : 0}
          </div>
        </div>

        <div className="live-footer">
          <button className="green-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
