import React from "react";
import "./view-patient.css";

const ViewPatient = ({ patient, onClose }) => {
  return (
    <div className="patient-modal-overlay">
      <div className="patient-card">

        {/* Top Header Bar */}
        <div className="top-bar">
          <div className="head-id">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#4fa5a7">
                <path d="M12 4.5C7 4.5 2.7 7.6 1 12c1.7 4.4 6 7.5 11 7.5s9.3-3.1 11-7.5c-1.7-4.4-6-7.5-11-7.5zm0 13a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11z"/>
              </svg> View - id: {patient.id}
          </div>
          <button className="close-x" onClick={onClose}>✕</button>
        </div>

        <hr/>

        {/* Patient Info Section */}
        <div className="details-grid">
          <div>
            <p className="key">Name:</p>
            <p className="value">{patient.name}</p>
          </div>

          <div>
            <p className="key">Age:</p>
            <p className="value">{patient.age}</p>
          </div>
          <div>
            <p className="key">Gender:</p>
            <p className="value">{patient.gender}</p>
          </div>

          <div>
            <p className="key">Date of Entry:</p>
            <p className="value">{new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Most Recent Test */}
        <h4 className="test-title">Most Recent Test</h4>

        <table className="test-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Test Type</th>
              <th>Smear Type</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{new Date().toLocaleDateString()}</td>
              <td>Microscopy</td>
              <td>ZN Smear</td>
            </tr>
          </tbody>
        </table>

        {/* Print Button */}
        <div className="print-box">
          <button className="print-btn">🖨 Print</button>
        </div>

      </div>
    </div>
  );
};

export default ViewPatient;
