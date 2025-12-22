import React, { useState, useEffect } from 'react';
import './patient.css';
import RunTest from './run';
import ViewPatient from './ViewPatient';
import RunTestPage from './RunTestPage';
import DeletePrompt from "./DeletePrompt";


const Patient = ({ onClose }) => {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [searchId, setSearchId] = useState('');
  const [showRunTest, setShowRunTest] = useState(false);
  const [showView, setShowView] = useState(false);
  const [showRun, setShowRun] = useState(false);
  const [showDeletePrompt, setShowDeletePrompt] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [captures, setCaptures] = useState([]); // 👈 Added captures state

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/patients');
      const data = await res.json();
      setPatients(data);
      setFilteredPatients(data);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  const handleSearch = () => {
  const filtered = patients.filter(p =>
    (p.id && p.id.toLowerCase().includes(searchId.toLowerCase())) ||
    (p.name && p.name.toLowerCase().includes(searchId.toLowerCase()))
  );
  setFilteredPatients(filtered);
};

  const handleView = (patient) => {
    setSelectedPatient(patient);
    setShowView(true);
  };

  const handleRunTest = (patient) => {
    setSelectedPatient(patient);
    setCaptures([]); // Reset captures for new test
    setShowRun(true);
  };

const handleDeleteClick = (patient) => {
     console.log("Deleting ID:", patient.id); // 👈 Verify ID
     setSelectedPatient(patient);
     setShowDeletePrompt(true);
   };

  const confirmDelete = async () => {
    try {
      await fetch(`http://localhost:8000/api/patients/${selectedPatient.id}`, {
        method: 'DELETE',
      });
      fetchPatients();
    } catch (err) {
      console.error("Delete error:", err);
    }
    setShowDeletePrompt(false);
  };

  const handleCapturesUpdate = (capture) => {
    setCaptures((prev) => [...prev, capture]);
  };

  return (
    <div className="run-test-overlay">
      <div className="patient-container">
        <header className="run-test-header">
          <h4>Patient Records</h4>
          <button className="close-button" onClick={onClose}>×</button>
        </header>
        <hr /><br/>
        <div className='add'>
        <input
  placeholder=" Search by ID, Name or Date of last test 🔍"
  className='search'
  value={searchId}
  onChange={(e) => {
    setSearchId(e.target.value);
    if (!e.target.value.trim()) setFilteredPatients(patients);
  }}
  onKeyDown={(e) => {
    if (e.key === 'Enter') handleSearch();  // 🔹 Press Enter to search
  }}
/>
          <button className='search-btn' onClick={handleSearch}>Search</button>
          <button className='add1' onClick={() => setShowRunTest(true)}>+ Add Patient</button>
        </div>
        <div className="folder-grid">
  {filteredPatients.length > 0 ? (
    filteredPatients.map(p => (
      <div key={p.id} className="folder-card">
        <div className="folder-icon">
          <svg width="50" height="30" viewBox="0 0 22 22" fill="none" stroke="#143d3eff" strokeWidth="2">
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M5 21v-2a4 4 0 0 1 8 0v2"></path>
            <line x1="16" y1="10" x2="22" y2="10"></line>
            <line x1="16" y1="14" x2="22" y2="14"></line>
            <line x1="16" y1="18" x2="22" y2="18"></line>
          </svg>
          <span className='num'>{p.id}</span>
          <button className="action-btn delete" id="del" onClick={() => handleDeleteClick(p)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 24 24" fill="#e74c3c">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
          </button>
        </div>
        <div className="folder-actions">
          <div className='option'>
            <button className="action-btn" id="view" onClick={() => handleView(p)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="30" height="26" viewBox="0 0 24 24" fill="#4fa5a7">
                <path d="M12 4.5C7 4.5 2.7 7.6 1 12c1.7 4.4 6 7.5 11 7.5s9.3-3.1 11-7.5c-1.7-4.4-6-7.5-11-7.5zm0 13a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11z"/>
              </svg>
              <br/>View
            </button>
            <button className="action-btn" id="run" onClick={() => handleRunTest(p)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="#4fa5a7">
                <path d="M10 16.5l6-4.5-6-4.5v9zM12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z"/>
              </svg>
              <br/><span id='color'>Run Test</span>
            </button>
          </div>
        </div>
      </div>
    ))
  ) : (
    <p className="space">No patients found. Add a new patient!</p>
  )}
</div>
</div>

{showView && <ViewPatient patient={selectedPatient} onClose={() => setShowView(false)} captures={captures} />}
{showRun && (
  <RunTestPage
    patient={selectedPatient}
    onClose={() => setShowRun(false)}
    onCapturesUpdate={handleCapturesUpdate}
  />
)}
{showRunTest && <RunTest onClose={() => setShowRunTest(false)} refresh={fetchPatients} />}

{showDeletePrompt && (
  <DeletePrompt
    onClose={() => setShowDeletePrompt(false)}
    onConfirm={confirmDelete}
    patient={selectedPatient}
  />
)}


</div>
);
};

export default Patient;