import React from 'react';
import './view-patient.css';

const ViewPatient = ({ patient, onClose, captures = [] }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <header className="modal-header">
          <h4>📄 {patient.id} Details</h4>
          <button className="close-btn" onClick={onClose}>×</button>
        </header>
        <hr />
        <div className="modal-body">
          <p><b>Name:</b> {patient.name}</p>
          <p><b>Age:</b> {patient.age}</p>
          <p><b>Gender:</b> {patient.gender}</p>
          <p><b>Date of Entry:</b> {new Date().toLocaleDateString()}</p>

          <h5>Test Captures:</h5>
          {captures.length === 0 ? (
            <p>No images captured yet.</p>
          ) : (
            captures.map((c, i) => (
              <div key={i} className="capture-item">
                <img src={c.image} alt="test" width="100" />
                <p>{c.date} | {c.type}</p>
                <button>View Analysis</button>
                <button onClick={() => window.print()}>Print</button>
              </div>
            ))
          )}
        </div>
        <footer className="modal-footer">
          <button className="btn-close" onClick={onClose}>Close</button>
        </footer>
      </div>
    </div>
  );
};

export default ViewPatient;
