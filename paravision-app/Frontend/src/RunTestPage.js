import React, { useState, useRef, useEffect } from 'react';
import './run-test-page.css';

const RunTestPage = ({ patient, onClose, onTestComplete }) => {
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

  const isActive = (section) => testType === 'Both' || testType === section;
  const isBloodActive = isActive('Blood');
  const isStoolActive = isActive('Stool');
  const isStartDisabled = !testType || (testType.includes('Blood') && !bloodSubType) || (testType.includes('Stool') && !stoolMethod);

  useEffect(() => {
    if (testType) {
      navigator.mediaDevices.enumerateDevices().then(devices => {
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        setCameras(videoDevices);
        if (videoDevices.length < 2 && testType === 'Both') alert("Need 2 cameras for Blood + Stool!");
        // choose indices defensively
        if (testType === 'Stool') setStoolCameraId(videoDevices[0]?.deviceId || '');
        if (testType === 'Blood') setBloodCameraId(videoDevices[0]?.deviceId || ''); // default to first available
        if (testType === 'Both') {
          setBloodCameraId(videoDevices[0]?.deviceId || '');
          setStoolCameraId(videoDevices[1]?.deviceId || videoDevices[0]?.deviceId || '');
        }
      }).catch(err => console.error('Error listing cameras:', err));
    }
  }, [testType]);

  const openCamera = async () => {
    if (testType === 'Both' && cameras.length < 2) return alert("Add 2 cameras!");
    setShowCamera(true);
    try {
      if (testType === 'Both') {
        const bloodStream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: bloodCameraId } } });
        const stoolStream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: stoolCameraId } } });
        bloodVideoRef.current.srcObject = bloodStream;
        stoolVideoRef.current.srcObject = stoolStream;
        bloodVideoRef.current.play();
        stoolVideoRef.current.play();
      } else {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: isBloodActive ? bloodCameraId : stoolCameraId } }
        });
        bloodVideoRef.current.srcObject = stream;
        bloodVideoRef.current.play();
      }
    } catch (err) {
      alert("Camera error! 😔");
      console.error(err);
    }
  };

  const stopCamera = () => {
    [bloodVideoRef, stoolVideoRef].forEach(ref => {
      try { ref.current?.srcObject?.getTracks().forEach(track => track.stop()); } catch (e) {}
    });
    setShowCamera(false);
  };

  const handleCancel = () => {
    if (window.confirm("Test progress unsaved. Cancel?")) {
      setIsScanning(false);
      stopCamera();
    }
  };

  const handleStartTest = async () => {
    setIsScanning(true);

    const payload = {
      patientId: patient.id,
      name: patient.name,
      type: testType,
      smear: bloodSubType || stoolMethod,
      date: new Date().toISOString(),
      result: "Pending..."
    };

    try {
      const res = await fetch("http://localhost:8000/api/tests", {   // <-- correct URL
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Expect backend to return saved test object
      const savedTest = await res.json();

      // If backend returns { ok: true, id: ... } or the full object, normalize:
      const normalized = savedTest && savedTest.id
        ? { ...payload, id: savedTest.id }
        : (savedTest && savedTest.ok && savedTest.id) ? { ...payload, id: savedTest.id } : savedTest || { ...payload, id: `${Date.now()}` };

      // Call parent callback exactly as ViewPatient expects
      if (typeof onTestComplete === "function") {
        onTestComplete(normalized);
      }

      

    } catch (err) {
      console.error("Error saving test:", err);
      setIsScanning(false);
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
                <p className='id2'><b>ID:</b> {patient.id}</p>
              </div>
              <div className="test-options">
                <label><b>Test Type: </b>
                  <select value={testType} onChange={e => setTestType(e.target.value)}>
                    <option value="">Pick</option>
                    <option value="Blood">Blood</option>
                    <option value="Stool">Stool</option>
                    <option value="Both">Blood + Stool</option>
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
            <header className='live'><h4>Microscopic live View</h4><button onClick={stopCamera}>×</button></header>
            <div className="modal-body">
              {testType === 'Both' ? (
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
                <button className="btn-close" onClick={handleCancel}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RunTestPage;
