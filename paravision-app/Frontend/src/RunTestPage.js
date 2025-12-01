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
  const isBloodActive = isActive('blood');
  const isStoolActive = isActive('stool');

  const isStartDisabled =
    !testType ||
    (testType.includes('blood') && !bloodSubType) ||
    (testType.includes('stool') && !stoolMethod);

  useEffect(() => {
    if (testType === 'both' || testType === 'blood' || testType === 'stool') {
      navigator.mediaDevices.enumerateDevices().then(devices => {
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        setCameras(videoDevices);
        if (videoDevices.length < 2 && testType === 'both') {
          alert("Need 2 cameras for Blood + Stool!");
        }
        if (testType === 'stool') setStoolCameraId(videoDevices[0]?.deviceId || '');
        if (testType === 'blood') setBloodCameraId(videoDevices[2]?.deviceId || '');
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
      alert("Camera error!");
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
            <header className='tpp'><h4>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="20" viewBox="0 0 24 24" fill="#4fa5a7">
                <path d="M10 16.5l6-4.5-6-4.5v9zM12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z"/>
              </svg>  Run Test</h4><button onClick={onClose}>×</button></header>
            <hr />
            <div className="modal-body">
              <div className='identity'>
              <p><b>Patient:</b> {patient.name}</p>
              <p className='id2'><b>ID:</b> {patient.id}</p></div>
              <div className="test-options">
                <label><b>Test Type: </b>
                <select value={testType} onChange={e => setTestType(e.target.value)}>
                  <option value="">Pick</option>
                  <option value="blood">Blood</option>
                  <option value="stool">Stool</option>
                  <option value="both">Blood + Stool</option>
                </select></label>

                <div className={!isBloodActive ? 'disabled' : ''}>
                  <label><b>Blood Type: </b>
                   <select value={bloodSubType} onChange={e => setBloodSubType(e.target.value)} disabled={!isBloodActive}>
                    <option value="">Choose</option>
                    <option>Thick Smear</option>
                    <option>Thin Smear</option>
                  </select></label>
                </div>

                <div className={!isStoolActive ? 'disabled' : ''}>
                  <label><b>Stool Method: </b>
                  <select value={stoolMethod} onChange={e => setStoolMethod(e.target.value)} disabled={!isStoolActive}>
                    <option value="">Choose</option>
                    <option>Direct Smear</option>
                    <option>Concentration</option>
                  </select></label>
                </div>
              </div>
              <button className='btn31'
                onClick={() => setIsScanning(true)}
                disabled={isStartDisabled}>
                Start Test
              </button>
            </div>
          </>
        ) : showCamera ? (
          <div className="camera-modal">
            <header className='live'><h4>Microscopic live View</h4><button onClick={stopCamera}>×</button></header>
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
              <button className="btn-close1" onClick={stopCamera}>Close</button>
            </div>
          </div>
        ) : (
          <div className="scan-modal">
            <header><h4 className='test'>Test in Progress</h4><hr/></header>
            <div className="modal-body">
              <p>Analyzing {testType} sample</p>
              <div className="loader"></div>
              <div className='div'>
              <button className="l" onClick={openCamera}>View Live Capture</button>
              <button className="btn-close" onClick={handleCancel}>Cancel</button></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RunTestPage;