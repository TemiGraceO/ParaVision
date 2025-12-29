import React, { useEffect, useRef, useState } from "react";
import "./LiveCapture.css";

export default function LiveCapture({ onClose }) {
  const canvasRef = useRef(null);
  const runningRef = useRef(false);
  const [status, setStatus] = useState("Initializing camera…");
  const [detectionsCount, setDetectionsCount] = useState(0);

  const drawBoxes = (ctx, boxes) => {
    boxes.forEach((b) => {
      ctx.strokeStyle = "yellow";
      ctx.lineWidth = 2;
      ctx.strokeRect(b.x, b.y, b.width, b.height);

      ctx.fillStyle = "black";
      ctx.fillRect(b.x, b.y - 18, 90, 18);

      ctx.fillStyle = "yellow";
      ctx.font = "bold 13px sans-serif";
      ctx.fillText(`${Math.round(b.confidence * 100)}%`, b.x + 5, b.y - 4);
    });
  };

  const loop = async () => {
    if (!runningRef.current) return;

    try {
      const frame = await window.electronAPI.captureFrame();
      if (!frame.success) {
        requestAnimationFrame(loop);
        return;
      }

      const img = new Image();
      img.onload = async () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        canvas.width = 320;
        canvas.height = 240;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const detection = await window.electronAPI.detectMalaria(frame.image);
        if (detection.success) {
          drawBoxes(ctx, detection.boxes);
          setDetectionsCount(detection.boxes.length);
          setStatus(`Detections: ${detection.boxes.length}`);
        } else {
          console.error(detection.error);
          setStatus("Detection failed");
        }
      };
      img.src = `data:image/jpeg;base64,${frame.image}`;
    } catch (e) {
      console.error(e);
      setStatus("Camera error");
    }

    requestAnimationFrame(loop);
  };

  useEffect(() => {
    runningRef.current = true;

    (async () => {
      const cam = await window.electronAPI.testCamera();
      if (!cam.success) { setStatus("Camera not found"); return; }

      setStatus("Camera ready");
      requestAnimationFrame(loop);
    })();

    return () => { runningRef.current = false; };
  }, []);

  return (
    <div className="live-capture-overlay">
      <div className="live-capture-modal">
        <div className="live-header">
          <h2>Live Parasite Detection</h2>
          <button onClick={onClose}>X</button>
        </div>
        <canvas ref={canvasRef} />
        <div className="status-bar">
          <strong>{status}</strong>
          {detectionsCount > 0 && (
            <span style={{ marginLeft: 20, background: "yellow", padding: "4px 10px", borderRadius: "8px" }}>
              {detectionsCount} detections
            </span>
          )}
        </div>
        <button className="close-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
