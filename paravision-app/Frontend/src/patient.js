import React, { useState } from 'react';
import './patient.css';
import RunTest from './run';

const Patient = ({ onClose }) => {
  const [showRunTest, setShowRunTest] = useState(false);
  const handleRunTestClick = () => setShowRunTest(true);
  const handleCloseRunTest = () => {
    console.log("Closing RunTest overlay...");
    setShowRunTest(false);
  };

  return (
    <div className="run-test-overlay">
      <div className="patient-container">
        <header className="run-test-header">
          <h4>Patients Management</h4>
          <button className="close-button" onClick={onClose}>×</button>
        </header>
        <hr />
        <div className='add'>
          <input placeholder="Search by ID 🔍" className='search' type="search" />
          <button className='add1' onClick={handleRunTestClick}>Add +</button>
        </div>
      </div>
      {showRunTest && (
        <div className="run-test-overlay-wrapper">
          <RunTest 
            onClose={handleCloseRunTest} 
            closeAll={handleCloseRunTest} // 👈 Pass "closeAll"
          />
        </div>
      )}
    </div>
  );
};

export default Patient;
