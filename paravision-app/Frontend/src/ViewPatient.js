import { useState } from "react";
import "./view-patient.css";
import RunTestPage from './RunTestPage';

const ViewPatient = ({ patient, onClose, refresh }) => {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="patient-modal-overlay">
      <div className="patient-card">
        {/* Top Header Bar */}
        <div className="top-bar">
          <div className="head-id">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#4fa5a7">
              <path d="M12 4.5C7 4.5 2.7 7.6 1 12c1.7 4.4 6 7.5 11 7.5s9.3-3.1 11-7.5c-1.7-4.4-6-7.5-11-7.5zm0 13a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11z"/>
            </svg>
            Patient’s details — ID: {patient.id}
          </div>
          <button className="close-x" onClick={onClose}>✕</button>
        </div>
        <hr />

        {isEditing ? (
          <RunTestPage
            patient={patient}
            onClose={() => setIsEditing(false)}
            refresh={refresh}
          />
        ) : (
          <>
            {/* Patient Info Section */}
            <div className="details-grid">
              <div><p className="key">Name:</p><p className="value">{patient.name}</p></div>
              <div><p className="key">Age:</p><p className="value">{patient.age}</p></div>
              <div><p className="key">Gender:</p><p className="value">{patient.gender}</p></div>
              <div><p className="key">Date of Entry:</p><p className="value">{patient.date ? new Date(patient.date).toLocaleDateString() : "N/A"}</p></div>
              <button className="edit" onClick={() => setIsEditing(true)}>✏️ Edit</button>
            </div>

            {/* Most Recent Test */}
            <h4 className="test-title">Most Recent Test</h4>
            <table className="test-table">
              <thead><tr><th>Date</th><th>Test Type</th><th>Smear Type</th></tr></thead>
              <tbody>
                <tr>
                  <td>{patient.testDate ? new Date(patient.testDate).toLocaleDateString() : "N/A"}</td>
                  <td>{patient.testType || "Microscopy"}</td>
                  <td>{patient.smearType || "ZN Smear"}</td>
                </tr>
              </tbody>
            </table>

            {/* Print Button */}
            <div className="print-box">
              <button className="print-btn" onClick={() => window.print()}>🖨 Print details</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ViewPatient;