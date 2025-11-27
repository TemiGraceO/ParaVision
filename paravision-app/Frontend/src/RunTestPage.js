import React, { useState, useRef, useEffect } from 'react';
import './run-test-page.css';

const RunTestPage = ({ patient, onClose, onCapturesUpdate }) => {
  const [testType, setTestType] = useState('');
  const [bloodSubType, setBloodSubType] = useState('');
  const [stoolMethod, setStoolMethod] = useState('');
  const [bloodCameraId, setBloodCameraId] = useState('');
  const [stoolCameraId, setStoolCameraId] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameras, setCameras] = useState([]);
  const bloodVideoRef = useRef(null);
  const stoolVideoRef = useRef(null);
  const canvasRef = useRef(null);

  const isActive = (section) => testType === 'both' || testType === section;

  useEffect(() => {
    if (testType === 'both' || testType === 'blood' || testType === 'stool') {
      navigator.mediaDevices.enumerateDevices().then(devices => {
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        setCameras(videoDevices);
        if (videoDevices.length < 2 && testType === 'both') {
          alert("⚠️ Need 2 cameras for Blood + Stool!");
        }
        if (testType === 'stool') {
          setStoolCameraId(videoDevices[0]?.deviceId || '');
        }
        if (testType === 'blood') {
          setBloodCameraId(videoDevices[2]?.deviceId || '');
        }
        if (testType === 'both') {
          setBloodCameraId(videoDevices[2]?.deviceId || '');
          setStoolCameraId(videoDevices[0]?.deviceId || '');
        }
      }).catch(err => console.error('Error listing cameras:', err));
    }
  }, [testType]);

  const openCamera = async () => {
    if (testType === 'both' && cameras.length < 2) return alert("Add 2 cameras!");
    setShowCamera(true);
    try {
      if (testType === 'both') {
        const bloodStream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: bloodCameraId } } });
        const stoolStream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: stoolCameraId } } });
        bloodVideoRef.current.srcObject = bloodStream;
        stoolVideoRef.current.srcObject = stoolStream;
        bloodVideoRef.current.play();
        stoolVideoRef.current.play();
      } else if (testType === 'blood') {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: bloodCameraId } } });
        bloodVideoRef.current.srcObject = stream;
        bloodVideoRef.current.play();
      } else if (testType === 'stool') {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: stoolCameraId } } });
        bloodVideoRef.current.srcObject = stream;
        bloodVideoRef.current.play();
      }
    } catch (err) {
      alert("Camera error! 😕");
      console.error(err);
    }
  };

  const stopCamera = () => {
    [bloodVideoRef, stoolVideoRef].forEach(ref => {
      ref.current?.srcObject?.getTracks().forEach(track => track.stop());
    });
    setShowCamera(false);
  };

  const handleCancel = () => {
    if (window.confirm("Test progress unsaved. Cancel?")) {
      setIsScanning(false);
      stopCamera();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {!isScanning ? (
          <>
            <header><h4>Run Test: {patient.id}</h4><button onClick={onClose}>×</button></header>
            <hr />
            <div className="modal-body">
              <p><b>Patient:</b> {patient.name}</p>
              <div className="test-options">
                <label>Test:</label>
                <select value={testType} onChange={e => setTestType(e.target.value)}>
                  <option value="">Pick…</option>
                  <option value="blood">Blood</option>
                  <option value="stool">Stool</option>
                  <option value="both">Blood + Stool</option>
                </select>
                {isActive('blood') && (
                  <div>
                    <label>Blood Type:</label>
                    <select value={bloodSubType} onChange={e => setBloodSubType(e.target.value)}>
                      <option value="">Choose</option>
                      <option>Thick Smear</option>
                      <option>Thin Smear</option>
                    </select>
                  </div>
                )}
                {isActive('stool') && (
                  <div>
                    <label>Stool Method:</label>
                    <select value={stoolMethod} onChange={e => setStoolMethod(e.target.value)}>
                      <option value="">Choose</option>
                      <option>Direct Smear</option>
                      <option>Concentration</option>
                    </select>
                  </div>
                )}
              </div>
              <button onClick={() => setIsScanning(true)} disabled={
                !testType || (testType.includes('blood') && !bloodSubType) || (testType.includes('stool') && !stoolMethod)
              }>Start Test</button>
            </div>
            <footer><button onClick={onClose}>Close</button></footer>
          </>
        ) : showCamera ? (
          <div className="camera-modal">
            <header><h4>📸 Live Capture</h4><button onClick={stopCamera}>×</button></header>
            <div className="modal-body">
              {testType === 'both' ? (
                <div className="dual-feed">
                    
                  <video ref={bloodVideoRef} className="feed" autoPlay playsInline />
                  <video ref={stoolVideoRef} className="feed" autoPlay playsInline />
                </div>
              ) : (
                <video ref={bloodVideoRef} className="camera-feed" autoPlay playsInline />
              )}
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>
            <footer className="modal-footer">
              <button className="btn-close" onClick={stopCamera}>Close</button>
              <button className="capture-btn">Capture Frame</button>
            </footer>
          </div>
        ) : (
          <div className="scan-modal">
            <header><h4>🔬 Test in Progress...</h4></header>
            <div className="modal-body">
              <p>Analyzing {testType} sample...</p>
              <div className="loader"></div>
              <button className="live-capture-btn" onClick={openCamera}>View Live Capture</button>
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