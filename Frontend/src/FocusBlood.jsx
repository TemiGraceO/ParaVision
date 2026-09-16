import React, { useEffect, useRef } from "react";
import "./FocusBlood.css";

const FocusBlood = ({ visible, onClose }) => {
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!visible) return;

    // Create video element for capturing
    const video = document.createElement("video");
    video.autoplay = true;
    videoRef.current = video;

    let stream;

    const startCamera = async () => {
      try {
        // Get list of cameras
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === "videoinput");
        console.log("Available cameras:", videoDevices);

        // Use camera 0 (Blood)
        const deviceId = videoDevices[0]?.deviceId;
        if (!deviceId) throw new Error("No camera found");

        stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId }
        });
        video.srcObject = stream;

        // Draw video to canvas
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        canvas.width = 960;
        canvas.height = 540;

        intervalRef.current = setInterval(() => {
          if (video.readyState === video.HAVE_ENOUGH_DATA) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          }
        }, 30); // ~30fps
      } catch (err) {
        console.error("FocusBlood camera error:", err);
      }
    };

    startCamera();

    return () => {
      clearInterval(intervalRef.current);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [visible]);

  if (!visible) return null;

  return (
  <div className={`focus-blood-overlay ${visible ? "show" : ""}`}>
    <div
      className="focus-blood-modal"
      onClick={(e) => e.stopPropagation()}  // ?? prevents overlay clicks
    >
      <div className="focus-blood-header">
        <h3>Focus Blood Camera</h3>
        <button className="close-x" onClick={onClose}>X</button>
      </div>
      <div className="focus-blood-body">
        <canvas ref={canvasRef} />
      </div>
    </div>
  </div>
);
};
export default FocusBlood;
