import { useEffect, useRef, useState } from "react";

const INTERVAL = 1000;

export default function EmbeddedBloodCapture({ onDetection, visible = true }) {
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);
  const totalParasitesRef = useRef(new Set());
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (!visible) {
      clearInterval(intervalRef.current);
      return;
    }

    const captureLoop = async () => {
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
          if (!result?.boxes) return;

          ctx.strokeStyle = "#00c48c";
          ctx.lineWidth = 2;
          ctx.fillStyle = "#ff4d4d";
          ctx.font = "14px Arial";

          let newParasites = 0;

          result.boxes.forEach((b) => {
            const key = `${b.x1}-${b.y1}-${b.x2}-${b.y2}`;
            if (!totalParasitesRef.current.has(key)) {
              totalParasitesRef.current.add(key);
              newParasites += 1;
            }

            ctx.strokeRect(
              b.x1 * 3,  // scale to canvas
              b.y1 * 2,
              (b.x2 - b.x1) * 3,
              (b.y2 - b.y1) * 2
            );

            ctx.fillText(
              "Parasitized",
              b.x1 * 3,
              b.y1 * 2 - 5
            );
          });

          const updatedTotal = totalParasitesRef.current.size;
          setTotalCount(updatedTotal);
          onDetection?.(updatedTotal);
        };
        img.src = frame.dataUrl;
      } catch (e) {
        console.error("Embedded blood capture error:", e);
      }
    };

    captureLoop();
    intervalRef.current = setInterval(captureLoop, INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [onDetection, visible]);

  return <canvas ref={canvasRef} />;
}
