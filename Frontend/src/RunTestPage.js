import React, { useState, useEffect } from 'react';
import './run-test-page.css';
import FocusBlood from './FocusBlood';
import FocusStool from './FocusStool';

const LED_BLOOD = 'LED_1';
const LED_STOOL = 'LED_2';
const API_BASE_URL = 'http://localhost:8000';


const RunTestPage = ({ patient, onClose, onTestSelected }) => {
  const [testType, setTestType] = useState('');
  const [bloodSubType, setBloodSubType] = useState('');
  const [stoolMethod, setStoolMethod] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBloodFocus, setShowBloodFocus] = useState(false);
  const [showStoolFocus, setShowStoolFocus] = useState(false);

  // --- Corrected: useEffect inside component ---
  useEffect(() => {
  // Show camera only if Blood is selected (single or combined)
  if (testType === 'Blood' || testType === 'Stool and Blood') {
    setShowBloodFocus(true);
  } else {
    setShowBloodFocus(false);
  }
}, [testType]);
  
  useEffect(() => {
  // Show Stool camera only if Stool is selected (single or combined)
  if (testType === 'Stool' || testType === 'Stool and Blood') {
    setShowStoolFocus(true);
  } else {
    setShowStoolFocus(false);
  }
}, [testType]);
 
  // Show Blood camera if Blood or Blood+Stool
useEffect(() => {
  if (testType === 'Blood' || testType === 'Stool and Blood') {
    setShowBloodFocus(true);
  } else {
    setShowBloodFocus(false);
  }
}, [testType]);

// Show Stool camera if Stool or Blood+Stool
useEffect(() => {
  if (testType === 'Stool' || testType === 'Stool and Blood') {
    setShowStoolFocus(true);
  } else {
    setShowStoolFocus(false);
  }
}, [testType]);

  useEffect(() => {
    if (testType === 'Blood') {
      setStoolMethod('');
    } else if (testType === 'Stool') {
      setBloodSubType('');
    } else if (testType === 'Stool and Blood') {
      // keep both
    } else {
      setBloodSubType('');
      setStoolMethod('');
    }
  }, [testType]);

  // Determine active sections
  const isActive = (section) => testType === 'Stool and Blood' || testType === section;
  const isBloodActive = isActive('Blood');
  const isStoolActive = isActive('Stool');

  // Disable Start button if required fields are missing
  const isStartDisabled =
    !testType ||
    (testType.includes('Blood') && !bloodSubType) ||
    (testType.includes('Stool') && !stoolMethod) ||
    (testType === 'Stool and Blood' && (!bloodSubType || !stoolMethod));

  // Helper to set GPIO via Electron preload
  const setGPIO = async (state) => {
    if (!window.electronAPI?.setGPIO) {
      console.error('electronAPI.setGPIO is missing. Check preload.js exposure.');
      throw new Error('electronAPI.setGPIO is not available');
    }
    return await window.electronAPI.setGPIO(state);
  };

  const handleStartTest = async () => {
    if (isStartDisabled) return;

    setLoading(true);
    try {
      if (!patient?.id || !patient?.name) throw new Error('Patient data missing');

      console.log('[RunTest] Starting test', { testType, bloodSubType, stoolMethod, patient });

      // --- Corrected: define smear BEFORE payload ---
      let smear = 'N/A';
      if (testType === 'Blood') {
        smear = bloodSubType;
      } else if (testType === 'Stool') {
        smear = stoolMethod;
      } else if (testType === 'Stool and Blood') {
        smear = `${bloodSubType} + ${stoolMethod}`;
      }

      // --- Payload now valid ---
      const payload = {
         patientId: patient.id,
         patientName: patient.name,   // ? renamed & valid
         type: testType,
         smear,
         date: new Date().toISOString(),
         status: "pending",
};


      console.log('[RunTest] POST /api/tests payload:', payload);

      const res = await fetch(`${API_BASE_URL}/api/tests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`/api/tests failed: ${res.status} ${txt}`);
      }

      const savedTest = await res.json();
      const normalized = { ...payload, id: savedTest?.id || `${Date.now()}` };

      console.log('[RunTest] Test created:', normalized);

      // --- Set GPIO ---
      let gpioState;
      switch (testType) {
        case 'Blood':
          gpioState = { [LED_BLOOD]: true, [LED_STOOL]: false };
          break;
        case 'Stool':
          gpioState = { [LED_BLOOD]: false, [LED_STOOL]: true };
          break;
        case 'Stool and Blood':
          gpioState = { [LED_BLOOD]: true, [LED_STOOL]: true }; // Both LEDs on
          break;
        default:
          gpioState = { [LED_BLOOD]: false, [LED_STOOL]: false };
      }

      console.log('[RunTest] Setting GPIO:', gpioState);
      await setGPIO(gpioState);

      // Restore LEDs after 60 seconds
      setTimeout(() => {
        setGPIO({ [LED_BLOOD]: false, [LED_STOOL]: false }).catch((e) =>
          console.error('[RunTest] Failed to restore LEDs:', e)
        );
      }, 60000);

      // --- Open the corresponding test window ---
      let result = null;

      if (testType === 'Blood') {
        if (!window.electronAPI.openMalariaTest) throw new Error('openMalariaTest missing in preload');
        result = await window.electronAPI.openMalariaTest(normalized);
      } else if (testType === 'Stool') {
        if (!window.electronAPI.openStoolTest) throw new Error('openStoolTest missing in preload');
        result = await window.electronAPI.openStoolTest(normalized);
      } else if (testType === 'Stool and Blood') {
        if (!window.electronAPI.openBothTest) throw new Error('openBothTest missing in preload');
        result = await window.electronAPI.openBothTest(normalized);
      }

      console.log('[RunTest] Returned from next page with result:', result);

      // --- Save test result if returned ---
      if (result) {
        const put = await fetch(`${API_BASE_URL}/api/tests/${normalized.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(result),
        });

        if (!put.ok) {
          const txt = await put.text();
          throw new Error(`PUT /api/tests/${normalized.id} failed: ${put.status} ${txt}`);
        }
      }

      // --- Notify parent + close modal ---
      onTestSelected(normalized, testType);
      onClose();
    } catch (err) {
      console.error('[RunTest] ERROR:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    try {
      await setGPIO({ [LED_BLOOD]: false, [LED_STOOL]: false });
    } catch (e) {
      console.error('[RunTest] Close restore LEDs failed:', e);
    }
    onClose();
  };

  // --- JSX unchanged ---

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <header className="tpp">
          <h4>
          <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="#4fa5a7">
                <path d="M10 16.5l6-4.5-6-4.5v9zM12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z"/>
              </svg>
Run Test</h4>
          <button onClick={handleClose}>X</button>
        </header>
        <hr />
        <div className="modal-body">
          <div className="identity">
            <p><b>Patient:</b> {patient?.name}</p>
            <p className="id2"><b>ID:</b> {patient?.id}</p>
          </div>

          <div className="test-options">
            <label>
              <b>Test Type: </b>
              <select value={testType} onChange={e => setTestType(e.target.value)}>
                <option value="">Choose</option>
                <option value="Blood">Blood</option>
                <option value="Stool">Stool</option>
                <option value="Stool and Blood">Blood and Stool</option>
              </select>
            </label>

            <div className={!isBloodActive ? 'disabled' : ''}>
              <label>
                <b>Blood Type: </b>
                <select
                  value={bloodSubType}
                  onChange={e => setBloodSubType(e.target.value)}
                  disabled={!isBloodActive}
                >
                  <option value="">Choose</option>
                  <option>Thin Smear</option>
                  <option>Thick Smear</option>
                </select>
              </label>
            </div>

            <div className={!isStoolActive ? 'disabled' : ''}>
              <label>
                <b>Stool Method: </b>
                <select
                  value={stoolMethod}
                  onChange={e => setStoolMethod(e.target.value)}
                  disabled={!isStoolActive}
                >
                  <option value="">Choose</option>
                  <option>Normal Saline</option>
                  <option>Iodine</option>
                </select>
              </label>
            </div>
          </div>

          <button
            className="btn31"
            onClick={handleStartTest}
            disabled={isStartDisabled || loading}
          >
            {loading ? 'Running...' : 'Start Test'}
          </button>
        </div>
      </div>
    <FocusBlood
  visible={showBloodFocus && bloodSubType !== ''} // only show if a blood subtype is chosen
  onClose={() => setShowBloodFocus(false)}
/>
    <FocusStool
  visible={showStoolFocus && stoolMethod !== ''} // only show if a stool method is chosen
  onClose={() => setShowStoolFocus(false)}
/>

    </div>
  );
  

};

export default RunTestPage;
