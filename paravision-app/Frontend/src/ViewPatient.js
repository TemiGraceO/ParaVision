import React, { useState, useEffect } from "react";
import "./view-patient.css";
import RunTest from './run';

const ViewPatient = ({ patient, onClose, refresh, tests = [] }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  const [localTests, setLocalTests] = useState(tests);

  const filteredTests = localTests.filter(t =>
    t.patientId?.toLowerCase().includes(search.toLowerCase()) || t.date?.includes(search)
  );

  useEffect(() => {
    setMounted(true);
    setLocalTests(tests); // Sync prop tests
  }, [tests]); // Re-run when `tests` prop changes

  const handleTestComplete = (newTest) => {
    setLocalTests((prev) => [...prev, newTest]); // Add to table instantly
    refresh(); // Sync with backend
    setIsEditing(false);
  };

  return (
    <div className="patient-modal-overlay">
      <div className="patient-card">
        <div className="top-bar">
          <div className="head-id">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#4fa5a7">
              <path d="M12 4.5C7 4.5 2.7 7.6 1 12c1.7 4.4 6 7.5 11 7.5s9.3-3.1 11-7.5c-1.7-4.4-6-7.5-11-7.5zm0 13a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11z" />
            </svg>
            Patient’s details — ID: {patient.id}
          </div>
          <button className="close-x" onClick={onClose}>✕</button>
        </div>
        <hr />

        {isEditing ? (
          <RunTest
            patient={patient}
            onClose={() => setIsEditing(false)}
            onTestComplete={handleTestComplete}
          />
        ) : (
          mounted && (
            <>
              <div className="details-grid">
                <div><p className="key">Name:</p><p className="value">{patient.name}</p></div>
                <div><p className="key">Age:</p><p className="value">{patient.age}</p></div>
                <div><p className="key">Gender:</p><p className="value">{patient.gender}</p></div>
                <div><p className="key">Date of Entry:</p><p className="value">{patient.date ? new Date(patient.date).toLocaleDateString() : "N/A"}</p></div>
                <button className="edit" onClick={() => setIsEditing(true)}>Edit</button>
              </div>

              <h4 className="test-title">Test History</h4>
              <div className="hm-filters">
                <input
                  placeholder=" Search Patient ID or Date 🔍"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="hm-search-input"
                />
              </div>

              <table className="hm-table">
                <thead>
                  <tr>
                    <th>S/N</th>
                    <th>Date</th>
                    <th>Test Type</th>
                    <th>Smear Type</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTests.length ? (
                    filteredTests.map((t, i) => (
                      <tr key={t.id}>
                        <td>{i + 1}</td>
                        <td>{t.date}</td>
                        <td>{t.type}</td>
                        <td>{t.smear}</td>
                        <td>
                          <button className="hm-action-btn">View</button>
                          <button className="hm-action-btn">Print</button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="5">No tests found.</td></tr>
                  )}
                </tbody>
              </table>

              <div className="print-box">
                <button className="print-btn" onClick={() => window.print()}>🖨 Print details</button>
              </div>
            </>
          )
        )}
      </div>
    </div>
  );
};

export default ViewPatient;