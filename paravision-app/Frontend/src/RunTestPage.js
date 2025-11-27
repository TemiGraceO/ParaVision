import React, { useState, useRef, useEffect } from 'react';
import './run-test-page.css';

const RunTestPage = ({ patient, onClose, onCapturesUpdate }) => {
  const [testType, setTestType] = useState('');
  const [bloodSubType, setBloodSubType] = useState('');
  const [stoolMethod, setStoolMethod] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const handleStart = () => setIsScanning(true);
  const isActive = (section) => {
    if (testType === 'both') return true;
    if (testType === 'blood' && section === 'blood') return true;
    if (testType === 'stool' && section === 'stool') return true;
    return false;
  };

  const openCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      startCaptureLoop();
    } catch (err) {
      alert('Camera access denied! 😕');
    }
  };

  const startCaptureLoop = () => {
    const interval = setInterval(() => {
      if (videoRef.current && showCamera) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0);
        const dataURL = canvas.toDataURL('image/png');
        const capture = { image: dataURL, date: new Date().toLocaleString(), type: testType };
        onCapturesUpdate(capture); // Send to Patient.js
      }
    }, 3000);
    return () => clearInterval(interval);
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const handleCancel = () => {
    if (window.confirm("Test progress will be unsaved. Are you sure?")) {
      setIsScanning(false);
      stopCamera();
    }
  };

  useEffect(() => () => stopCamera(), []);

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {!isScanning ? (
          <>
            <header className="modal-header">
              <h4>Run Test: {patient.id}</h4>
              <button className="close-btn" onClick={onClose}>×</button>
            </header>
            <hr />
            <div className="modal-body">
              <p><b>Patient:</b> {patient.name}</p>
              <div className="test-options">
                <label>Test Combination:</label>
                <select value={testType} onChange={(e) => setTestType(e.target.value)}>
                  <option value="">Select...</option>
                  <option value="blood">Blood Test Only</option>
                  <option value="stool">Stool Test Only</option>
                  <option value="both">Blood + Stool</option>
                </select>
                <div className={`option-group ${isActive('blood') ? '' : 'disabled'}`}>
                  <label>Blood Type:</label>
                  <select value={bloodSubType} onChange={(e) => setBloodSubType(e.target.value)} disabled={!isActive('blood')}>
                    <option value="">Choose</option>
                    <option>Thick Smear</option>
                    <option>Thin Smear</option>
                  </select>
                </div>
                <div className={`option-group ${isActive('stool') ? '' : 'disabled'}`}>
                  <label>Stool Prep Method:</label>
                  <select value={stoolMethod} onChange={(e) => setStoolMethod(e.target.value)} disabled={!isActive('stool')}>
                    <option value="">Choose</option>
                    <option>Direct Smear</option>
                    <option>Concentration</option>
                  </select>
                </div>
              </div>
              <button className="start-test-btn" onClick={handleStart} disabled={!testType || (testType === 'blood' && !bloodSubType) || (testType === 'stool' && !stoolMethod) || (testType === 'both' && (!bloodSubType || !stoolMethod))}>
                Start Test
              </button>
            </div>
            <footer className="modal-footer">
              <button className="btn-close" onClick={onClose}>Close</button>
            </footer>
          </>
        ) : showCamera ? (
          <div className="camera-modal">
            <header>
              <h4>📸 Live Capture</h4>
              <button className="close-btn" onClick={stopCamera}>×</button>
            </header>
            <div className="modal-body">
              <video ref={videoRef} className="camera-feed" autoPlay playsInline />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>
            <footer>
              <button className="btn-close" onClick={stopCamera}>Close</button>
            </footer>
          </div>
        ) : (
          <div className="scan-modal">
            <header><h4>🔬 Test in Progress...</h4></header>
            <div className="modal-body">
              <p>Analyzing {testType}…</p>
              <div className="loader"></div>
              <button className="live-capture-btn" onClick={openCamera}>📸 View Live Capture</button>
            </div>
            <footer>
              <button className="btn-close" onClick={handleCancel}>Cancel</button>
            </footer>
          </div>
        )}
      </div>
    </div>
  );
};

export default RunTestPage;