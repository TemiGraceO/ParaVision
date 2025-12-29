import React, { useState } from 'react';
import './run-test-page.css';

const RunTestPage = ({ patient, onClose, onTestSelected }) => {  // CHANGED
  const [testType, setTestType] = useState('');
  const [bloodSubType, setBloodSubType] = useState('');
  const [stoolMethod, setStoolMethod] = useState('');

  const isActive = (section) => testType === 'Stool and Blood' || testType === section;
  const isBloodActive = isActive('Blood');
  const isStoolActive = isActive('Stool');
  const isStartDisabled = !testType || (testType.includes('Blood') && !bloodSubType) || (testType.includes('Stool') && !stoolMethod);

  const handleStartTest = async () => {
  const payload = {
    patientId: patient.id,
    name: patient.name,
    type: testType,
    smear: bloodSubType || stoolMethod,
    date: new Date().toISOString(),
    result: "Pending..."
  };

  try {
    const res = await fetch("http://localhost:8000/api/tests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const savedTest = await res.json();
    const normalized = savedTest?.id ? { ...payload, id: savedTest.id } : { ...payload, id: `${Date.now()}` };

    // Open the corresponding file using Electron's API
    switch (testType) {
      case 'Blood':
        await window.electronAPI.openMalariaTest(normalized);
        break;
      case 'Stool':
        await window.electronAPI.openStoolTest(normalized);
        break;
      case 'Stool and Blood':
        await window.electronAPI.openBothTest(normalized);
        break;
      default:
        // Handle the case where testType is not recognized
        console.error('Unknown test type:', testType);
        return;
    }

    // Callback to parent - no messaging needed
    onTestSelected(normalized, testType);
  } catch (err) {
    console.error("Error saving test:", err);
  }
};
  return (
    <div className="modal-overlay">
      <div className="modal-content">
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
      </div>
    </div>
  );
};

export default RunTestPage;
