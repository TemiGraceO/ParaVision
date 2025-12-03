import React from 'react';
import './view.css'

const ViewTestResult = ({ test, patient,onClose }) => {
  return (
    <div className="test-result-modal-overlay">
      <div className="test-result-card">
        <div className='test1'>
        <h2>Result</h2>
        <button className="close" onClick={onClose}>✕</button>
        </div>
        <div>
          <div className='a123'>
          <p><span className="key">Patient Name:</span> <span className="value">{patient.name}</span></p>
          <p><span className="key">PID:</span> <span className="value">{patient.id}</span></p>
          <p><span className="key">Test Type:</span> <span className="value">{test.type}</span></p>
          <p><span className="key">Date of Test:</span>  <span className="value">{new Date(test.date).toLocaleString()}</span></p>
          <p><span className='key'>Test Taken By: </span><span className='value'>{test.takenBy}</span></p>                    </div>
          {/* Add more test result details here */}
          <button className='btn31'>Print</button>
        </div>
      </div>
    </div>
  );
};

export default ViewTestResult;
