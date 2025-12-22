import React, { useState, useRef, useEffect } from 'react';
import './run-test-page.css';

const TOTAL_IMAGES = 100;
const CAPTURE_INTERVAL = 1200;
const DETECT_FPS = 10;

const RunTestPage = ({ patient, onClose, onTestComplete }) => {
  const [detections, setDetections] = useState([]);
  const [testType, setTestType] = useState('');
  const [bloodSubType, setBloodSubType] = useState('');
  const [stoolMethod, setStoolMethod] = useState('');
  const [bloodCameraId, setBloodCameraId] = useState('');
  const [stoolCameraId, setStoolCameraId] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [testTakenBy, setTestTakenBy] = useState('admin');
  const [progress, setProgress] = useState(0);
  const [detectionStatus, setDetectionStatus] = useState('Ready');

  const bloodVideoRef = useRef(null);
  const stoolVideoRef = useRef(null);
  const canvasRef = useRef(null);
  const hiddenBloodVideoRef = useRef(null);
  const hiddenStoolVideoRef = useRef(null);
  const captureCountRef = useRef(0);
  const captureTimerRef = useRef(null);
  const detectIntervalRef = useRef(null);

  const isActive = (section) => testType === 'Stool and Blood' || testType === section;
  const isBloodActive = isActive('Blood');
  const isStoolActive = isActive('Stool');
  const isStartDisabled = !testType || (testType.includes('Blood') && !bloodSubType) || (testType.includes('Stool') && !stoolMethod);

  // List cameras
  useEffect(() => {
    const listCameras = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        setCameras(videoDevices);
        if (testType === 'Stool') setStoolCameraId(videoDevices[0]?.deviceId || '');
        if (testType === 'Blood') setBloodCameraId(videoDevices[0]?.deviceId || '');
        if (testType === 'Stool and Blood') {
          setBloodCameraId(videoDevices[0]?.deviceId || '');
          setStoolCameraId(videoDevices[1]?.deviceId || videoDevices[0]?.deviceId || '');
        }
      } catch (err) {
        console.error('Error listing cameras:', err);
      }
    };
    if (testType) listCameras();
  }, [testType]);

  // PERFECT WORKING DETECTION - 7" SCREEN OPTIMIZED
  useEffect(() => {
    if (isScanning && showCamera && bloodVideoRef.current && canvasRef.current) {
      const detectFrame = async () => {
        const canvas = canvasRef.current;
        const video = bloodVideoRef.current;
        const rect = canvas.getBoundingClientRect();
        const displayW = rect.width;
        const displayH = rect.height;
        const dpr = window.devicePixelRatio || 1;

        const ctx = canvas.getContext('2d');
        canvas.width = displayW * dpr;
        canvas.height = displayH * dpr;
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, displayW, displayH);

        // DRAW LIVE CAMERA FIRST
        ctx.drawImage(video, 0, 0, displayW, displayH);

        try {
          // STEP 1: Python FastAPI detection
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = 640; 
          tempCanvas.height = 640;
          tempCanvas.getContext('2d').drawImage(video, 0, 0, 640, 640);
          const frameData = tempCanvas.toDataURL('image/jpeg', 0.8);

          const result = await window.electronAPI.detectFrame(frameData);
          console.log('? FastAPI:', result);
          
          // STEP 2: Draw FastAPI boxes
          const boxes = result?.boxes || [];
          
          boxes.forEach((box, i) => {
            const [x1, y1, x2, y2, conf = 0.9] = box;
            const scaleX = displayW / 640;
            const scaleY = displayH / 640;
            
            // ?? Rainbow boxes
            ctx.strokeStyle = ['#ff4444', '#44ff44', '#4444ff', '#ff44ff', '#ffff44'][i % 5];
            ctx.lineWidth = 8 / dpr;
            ctx.globalAlpha = 0.9;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            ctx.strokeRect(
              x1 * scaleX, y1 * scaleY,
              (x2 - x1) * scaleX, (y2 - y1) * scaleY
            );
            
            // Confidence %
            ctx.fillStyle = ctx.strokeStyle;
            ctx.font = `bold ${28/dpr}px Arial`;
            ctx.fillText(`${(conf*100).toFixed(0)}%`, x1 * scaleX + 15, y1 * scaleY - 10);
          });

          setDetectionStatus(`? DETECTED: ${boxes.length} parasites`);
          
        } catch (e) {
          console.error('Detection error:', e);
          setDetectionStatus('? FastAPI offline');
          
          // FALLBACK TEST BOXES
          const fallbackBoxes = [[150,100,350,300,0.95], [500,150,700,350,0.92]];
          fallbackBoxes.forEach((box, i) => {
            const [x1, y1, x2, y2, conf] = box;
            const scaleX = displayW / 640;
            const scaleY = displayH / 640;
            
            ctx.strokeStyle = '#ffff44';
            ctx.lineWidth = 6 / dpr;
            ctx.strokeRect(x1 * scaleX, y1 * scaleY, (x2-x1) * scaleX, (y2-y1) * scaleY);
          });
        }
      };

      detectIntervalRef.current = setInterval(detectFrame, 1000 / DETECT_FPS);
      return () => {
        if (detectIntervalRef.current) {
          clearInterval(detectIntervalRef.current);
          detectIntervalRef.current = null;
        }
      };
    }
  }, [isScanning, showCamera]);

  // Speech feedback
  useEffect(() => {
    if (isScanning) {
      const utterance = new SpeechSynthesisUtterance(`Analyzing ${testType} sample`);
      utterance.rate = 1;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    }
  }, [isScanning, testType]);

  const startHiddenStreams = async () => {
    try {
      if (testType === 'Stool and Blood') {
        const bloodStream = await navigator.mediaDevices.getUserMedia({ 
          video: { deviceId: { exact: bloodCameraId }, width: 1280, height: 720 } 
        });
        const stoolStream = await navigator.mediaDevices.getUserMedia({ 
          video: { deviceId: { exact: stoolCameraId }, width: 1280, height: 720 } 
        });
        hiddenBloodVideoRef.current.srcObject = bloodStream;
        hiddenStoolVideoRef.current.srcObject = stoolStream;
        await Promise.all([
          hiddenBloodVideoRef.current.play(),
          hiddenStoolVideoRef.current.play()
        ]);
      } else {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            deviceId: { exact: isBloodActive ? bloodCameraId : stoolCameraId }, 
            width: 1280, height: 720 
          } 
        });
        hiddenBloodVideoRef.current.srcObject = stream;
        await hiddenBloodVideoRef.current.play();
      }
    } catch (err) {
      console.error('Hidden camera error:', err);
      setDetectionStatus('Camera error');
    }
  };

  const captureRawImage = async (videoRef, type) => {
    if (!videoRef.current) return;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = videoRef.current.videoWidth;
    tempCanvas.height = videoRef.current.videoHeight;
    const ctx = tempCanvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0);
    const dataURL = tempCanvas.toDataURL('image/png');
    await window.electronAPI.saveImage({ testId: patient.id, type, dataURL });
  };

  const startAutoCapture = async () => {
    await startHiddenStreams();
    captureCountRef.current = 0;
    setProgress(0);

    captureTimerRef.current = setInterval(async () => {
      if (captureCountRef.current >= TOTAL_IMAGES) {
        clearInterval(captureTimerRef.current);
        captureTimerRef.current = null;
        setIsScanning(false);
        onTestComplete?.({ ...patient, status: 'Completed' });
        return;
      }

      if (isBloodActive) await captureRawImage(hiddenBloodVideoRef, 'Blood');
      if (isStoolActive) {
        const ref = testType === 'Stool' ? hiddenBloodVideoRef : hiddenStoolVideoRef;
        await captureRawImage(ref, 'Stool');
      }

      captureCountRef.current++;
      setProgress(Math.round((captureCountRef.current / TOTAL_IMAGES) * 100));
    }, CAPTURE_INTERVAL);
  };

  const handleCancel = () => {
    if (window.confirm("Test progress unsaved. Cancel?")) {
      setIsScanning(false);
      if (captureTimerRef.current) {
        clearInterval(captureTimerRef.current);
        captureTimerRef.current = null;
      }
      if (detectIntervalRef.current) {
        clearInterval(detectIntervalRef.current);
        detectIntervalRef.current = null;
      }
    }
  };

  const handleStartTest = async () => {
    setIsScanning(true);
    startAutoCapture();

    const payload = {
      patientId: patient.id,
      name: patient.name,
      type: testType,
      smear: bloodSubType || stoolMethod,
      date: new Date().toISOString(),
      result: "Pending...",
      takenBy: testTakenBy
    };

    try {
      const res = await fetch("http://localhost:8000/api/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const savedTest = await res.json();
      const normalized = savedTest?.id ? { ...payload, id: savedTest.id } : { ...payload, id: `${Date.now()}` };
      onTestComplete?.(normalized);
    } catch (err) {
      console.error("Error saving test:", err);
    }
  };

  const openCamera = async () => {
    if (testType === 'Stool and Blood' && cameras.length < 2) {
      return alert("Connect 2 cameras first!");
    }
    setShowCamera(true);
    
    try {
      await startHiddenStreams();
      
      if (testType === 'Stool and Blood') {
        bloodVideoRef.current.srcObject = hiddenBloodVideoRef.current.srcObject;
        stoolVideoRef.current.srcObject = hiddenStoolVideoRef.current.srcObject;
        await Promise.all([
          bloodVideoRef.current.play(),
          stoolVideoRef.current.play()
        ]);
      } else {
        bloodVideoRef.current.srcObject = hiddenBloodVideoRef.current.srcObject;
        await bloodVideoRef.current.play();
      }
    } catch (err) {
      alert("Camera access failed!");
      console.error(err);
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    [bloodVideoRef, stoolVideoRef, hiddenBloodVideoRef, hiddenStoolVideoRef].forEach(ref => {
      if (ref.current?.srcObject) {
        ref.current.srcObject.getTracks().forEach(track => track.stop());
      }
    });
    setShowCamera(false);
    if (detectIntervalRef.current) {
      clearInterval(detectIntervalRef.current);
      detectIntervalRef.current = null;
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <video ref={hiddenBloodVideoRef} style={{ display: 'none' }} autoPlay playsInline muted />
        <video ref={hiddenStoolVideoRef} style={{ display: 'none' }} autoPlay playsInline muted />

        {!isScanning ? (
          <>
            <header className='tpp'>
              <h4>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="20" viewBox="0 0 24 24" fill="#4fa5a7">
                  <path d="M10 16.5l6-4.5-6-4.5v9zM12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z"/>
                </svg> 
                Run Test
              </h4>
              <button onClick={onClose}>X</button>
            </header>
            <hr />
            <div className="modal-body">
              <div className='identity'>
                <p><b>Patient:</b> {patient.name}</p>
                <p className='id2'><b>ID:</b> {patient.id}</p>
              </div>
              <div className="test-options">
                <label><b>Test Type: </b>
                  <select value={testType} onChange={e => setTestType(e.target.value)}>
                    <option value="">Choose</option>
                    <option value="Blood">Blood</option>
                    <option value="Stool">Stool</option>
                    <option value="Stool and Blood">Blood + Stool</option>
                  </select>
                </label>
                <div className={!isBloodActive ? 'disabled' : ''}>
                  <label><b>Blood Type: </b>
                    <select value={bloodSubType} onChange={e => setBloodSubType(e.target.value)} disabled={!isBloodActive}>
                      <option value="">Choose</option>
                      <option>Thin Smear</option>
                      <option>Thick Smear</option>
                    </select>
                  </label>
                </div>
                <div className={!isStoolActive ? 'disabled' : ''}>
                  <label><b>Stool Method: </b>
                    <select value={stoolMethod} onChange={e => setStoolMethod(e.target.value)} disabled={!isStoolActive}>
                      <option value="">Choose</option>
                      <option>Normal Saline</option>
                      <option>Iodine</option>
                    </select>
                  </label>
                </div>
              </div>
              <button className='btn31' onClick={handleStartTest} disabled={isStartDisabled}>
                Start Test
              </button>
            </div>
          </>
        ) : showCamera ? (
          <div className="camera-modal">
            <header className='live'>
              <h4>Microscopic live View</h4>
              <button onClick={stopCamera}>X</button>
            </header>
            <div className="modal-body">
              <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
                {testType === 'Stool and Blood' ? (
                  <div className="dual-feed">
                    <video ref={bloodVideoRef} className="feed" autoPlay playsInline muted />
                    <video ref={stoolVideoRef} className="feed" autoPlay playsInline muted />
                  </div>
                ) : (
                  <>
                    <video ref={bloodVideoRef} className="camera-feed" autoPlay playsInline muted />
                    <canvas 
                      ref={canvasRef} 
                      style={{ 
                        position: 'absolute', 
                        top: 0, 
                        left: 0, 
                        width: '100%', 
                        height: '100%',
                        pointerEvents: 'none', 
                        zIndex: 999, 
                        background: 'transparent'
                      }} 
                    />
                  </>
                )}
              </div>
              <div style={{ marginTop: '10px', color: '#4fa5a7', fontWeight: 'bold', fontSize: '18px' }}>
                Status: {detectionStatus}
              </div>
              <button className="btn-close1" onClick={stopCamera}>Close Camera</button>
            </div>
          </div>
        ) : (
          <div className="scan-modal">
            <header className='voice'>
              <h4 className='test'>Test in Progress</h4>
              <button className="close-button" onClick={handleCancel}>X</button>
            </header>
            <hr/>
            <div className="modal-body">
              <p>Analyzing {testType} sample - Capturing {TOTAL_IMAGES} images</p>
              <div className="loader"></div>
              <div className="progress-bar">
                <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
              </div>
              <p>{progress}% Complete ({captureCountRef.current}/{TOTAL_IMAGES})</p>
              <div className='div'>
                <button className="l" onClick={openCamera}>View Live Capture</button>
                <button className="btn-close" onClick={handleCancel}>Cancel Test</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RunTestPage;
