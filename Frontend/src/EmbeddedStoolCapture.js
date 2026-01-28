import { useEffect, useRef, useState } from "react";

const INTERVAL = 1000;

export default function EmbeddedStoolCapture({ onDetection, visible = true }) {
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);
  const totalParasitesRef = useRef(new Set());
  const [presenceState, setPresenceState] = useState({
    Ascaris: "Absent",
    Hookworm: "Absent",
    Trichuris: "Absent"
  });

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
          const ctx = canvas.getContext("2d");

          canvas.width = 960;
          canvas.height = 540;
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Draw the camera frame
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const result = await window.electronAPI.detectFrameStool(frame.dataUrl);
          if (!result?.boxes) return;

          // Initialize presence
          const presence = {
            Ascaris: "Absent",
            Hookworm: "Absent",
            Trichuris: "Absent"
          };

          ctx.strokeStyle = "lime";
          ctx.lineWidth = 2;
          ctx.fillStyle = "yellow";
          ctx.font = "14px Arial";

          result.boxes.forEach((b) => {
            const key = `${b.x1}-${b.y1}-${b.x2}-${b.y2}`;
            totalParasitesRef.current.add(key); // optional, track unique boxes

            if (presence[b.class_name] !== undefined) {
              presence[b.class_name] = "Present";
            }

            // Draw bounding box
            ctx.strokeRect(
              b.x1 * 3, // scale to canvas
              b.y1 * 2,
              (b.x2 - b.x1) * 3,
              (b.y2 - b.y1) * 2
            );

            // Draw label
            ctx.fillText(
              `${b.class_name}`,
              b.x1 * 3,
              b.y1 * 2 - 5
            );
          });

          // Update presence state and callback
          setPresenceState(presence);
          onDetection?.(presence);
        };

        img.src = frame.dataUrl;
      } catch (e) {
        console.error("Embedded stool capture error:", e);
      }
    };

    captureLoop();
    intervalRef.current = setInterval(captureLoop, INTERVAL);

    return () => clearInterval(intervalRef.current);
  }, [onDetection, visible]);

  return <canvas ref={canvasRef} />;
}
