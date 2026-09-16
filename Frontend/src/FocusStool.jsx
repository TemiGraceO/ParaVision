import React, { useEffect, useRef } from "react";
import "./FocusStool.css";

const FocusStool = ({ visible, onClose }) => {
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!visible) return;

    const video = document.createElement("video");
    video.autoplay = true;
    videoRef.current = video;

    let stream;

    const startCamera = async () => {
      try {
        // List available video devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === "videoinput");
        console.log("Available cameras:", videoDevices);

        // Use camera 1 (Stool)
        const deviceId = videoDevices[1]?.deviceId;
        if (!deviceId) throw new Error("Camera 1 (Stool) not found");

        stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId }
        });
        video.srcObject = stream;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        canvas.width = 960;
        canvas.height = 540;

        intervalRef.current = setInterval(() => {
          if (video.readyState === video.HAVE_ENOUGH_DATA) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          }
        }, 30);
      } catch (err) {
        console.error("FocusStool camera error:", err);
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
    <div className={`focus-stool-overlay ${visible ? "show" : ""}`}>
      <div
        className="focus-stool-modal"
        onClick={(e) => e.stopPropagation()}  // ?? IMPORTANT
      >
        <div className="focus-stool-header">
          <h3>Focus Stool Camera</h3>
          <button className="close-x" onClick={onClose}>X</button>
        </div>
        <div className="focus-stool-body">
          <canvas ref={canvasRef} />
        </div>
      </div>
    </div>
  );
};

export default FocusStool;
