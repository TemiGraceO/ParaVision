import React, { useState, useEffect } from "react";
import "./view-patient.css";
import RunTestPage from './run';

const ViewPatient = ({ patient, onClose }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tests, setTests] = useState([]);
  const [search, setSearch] = useState('');

  const fetchTests = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/tests?patientId=${patient.id}`);
      const data = await res.json();
      setTests(data);
    } catch (err) {
      console.error("Error fetching tests:", err);
    }
  };

  useEffect(() => {
    if (!patient?.id) return;
    fetchTests();
  }, [patient.id]);

  const handleTestComplete = (newTest) => {
    // If backend returned { ok: true } (old behavior), try to use newTest data,
    // but correct backend below returns full saved test object.
    if (!newTest) return;
    // ensure date is present
    const normalized = {
      id: newTest.id || newTest._id || `${Date.now()}`,
      patientId: newTest.patientId || newTest.patientId,
      type: newTest.type || newTest.testType || newTest.type,
      smear: newTest.smear || newTest.smear,
      date: newTest.date || new Date().toISOString(),
      result: newTest.result || "Pending..."
    };

    setTests(prev => [normalized, ...prev]);
    setIsEditing(false);
  };

  const filteredTests = tests.filter(t => {
    try {
      return t.patientId.toLowerCase().includes(search.toLowerCase()) ||
             (t.date && t.date.toLowerCase().includes(search.toLowerCase()));
    } catch (e) {
      return false;
    }
  });

  return (
    <div className="patient-modal-overlay">
      <div className="patient-card">
        <div className="top-bar">
          <div className="head-id">Patient ID: {patient.id}</div>
          <button className="close-x" onClick={onClose}>✕</button>
        </div>
        <hr />
        {isEditing ? (
          <RunTestPage
            patient={patient}
            onClose={() => setIsEditing(false)}
            onTestComplete={handleTestComplete}   // <-- match child prop
          />
        ) : (
          <>
            <div className="details-grid">
              <div><p className="key">Name:</p><p className="value">{patient.name}</p></div>
              <div><p className="key">Age:</p><p className="value">{patient.age}</p></div>
              <div><p className="key">Gender:</p><p className="value">{patient.gender}</p></div>
              <div><p className="key">Date of Entry:</p><p className="value">{patient.date ? new Date(patient.date).toLocaleDateString() : "N/A"}</p></div>
              <button className="edit" onClick={() => setIsEditing(true)}>Edit</button>
            </div>
            <h4 className="test-title">Test History</h4>
            <input 
              placeholder="Search by Date or Test Type 🔍" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="hm" 
            />
            <div className="table-container">
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
                    <tr key={t.id || i}>
                      <td>{i + 1}</td>
                      <td>{t.date ? new Date(t.date).toLocaleString() : "N/A"}</td>
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
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ViewPatient;
