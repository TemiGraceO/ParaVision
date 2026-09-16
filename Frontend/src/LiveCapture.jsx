import React, { useEffect, useRef, useState } from "react";
import "./LiveCapture.css";

const INTERVAL = 1000; // ms between detections
const DISTANCE_THRESHOLD = 30; // pixels (tune if needed)

const LiveCapture = ({ visible, onClose, onDetection, currentCount = 0 }) => {
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);

  // Store detected parasites as centers { x, y }
  const parasitesRef = useRef([]);

  const [totalCount, setTotalCount] = useState(currentCount);

  /* ---------------- HELPER ---------------- */
  const isNewParasite = (x, y) => {
    return !parasitesRef.current.some(p => {
      const dx = p.x - x;
      const dy = p.y - y;
      return Math.sqrt(dx * dx + dy * dy) < DISTANCE_THRESHOLD;
    });
  };

  /* -------- RESET WHEN MODAL OPENS -------- */
  useEffect(() => {
    if (visible) {
      parasitesRef.current = [];
      setTotalCount(currentCount);
    }
  }, [visible, currentCount]);

  /* -------- CAPTURE + DETECTION LOOP -------- */
  useEffect(() => {
    if (!visible) {
      clearInterval(intervalRef.current);
      return;
    }

    let isProcessing = false;

    const captureLoop = async () => {
      if (isProcessing) return;
      isProcessing = true;

      try {
        const frame = await window.electronAPI.captureBloodFrame();
        if (!frame?.success) return;

        const img = new Image();
        img.onload = async () => {
          const canvas = canvasRef.current;
          if (!canvas) return;

          const ctx = canvas.getContext("2d");
          canvas.width = 960;
          canvas.height = 540;

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const result = await window.electronAPI.detectFrame(frame.dataUrl);
          if (!result?.success || !result.boxes) return;

          ctx.strokeStyle = "#00c48c";
          ctx.lineWidth = 2;
          ctx.font = "14px Arial";
          ctx.fillStyle = "#ff4d4d";

          result.boxes.forEach(b => {
            // Scale to canvas
            const x1 = b.x1 * 3;
            const y1 = b.y1 * 2;
            const w = (b.x2 - b.x1) * 3;
            const h = (b.y2 - b.y1) * 2;

            const centerX = x1 + w / 2;
            const centerY = y1 + h / 2;

            if (isNewParasite(centerX, centerY)) {
              parasitesRef.current.push({ x: centerX, y: centerY });
            }

            ctx.strokeRect(x1, y1, w, h);
            ctx.fillText("Parasitized", x1, y1 - 5);
          });

          const updatedTotal = parasitesRef.current.length;
          setTotalCount(updatedTotal);
          onDetection?.(updatedTotal);
        };

        img.src = frame.dataUrl;
      } catch (err) {
        console.error("LiveCapture error:", err);
      } finally {
        isProcessing = false;
      }
    };

    captureLoop();
    intervalRef.current = setInterval(captureLoop, INTERVAL);

    return () => clearInterval(intervalRef.current);
  }, [visible, onDetection]);

  /* ---------------- RENDER ---------------- */
  if (!visible) return null;

  return (
    <div className={`live-overlay ${visible ? "show" : ""}`}>
      <div
        className="live-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="live-header">
          <h2>Live View</h2>
          <button className="close-x" onClick={onClose}>X</button>
        </div>

        <div className="camera-wrapper">
          <canvas ref={canvasRef} />
        </div>

        <div className="live-overlay-stats">
          <h3>Total Parasites: <b>{totalCount}</b></h3>
        </div>

        <div className="live-footer">
          <button className="green-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default LiveCapture;
