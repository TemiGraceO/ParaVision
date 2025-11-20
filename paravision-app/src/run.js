import React, { useState } from 'react';
import './run.css';

const RunTest = ({ onClose }) => {
  const [smearType, setSmearType] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [patientId, setPatientId] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission here
    console.log({
      smearType,
      name,
      age,
      gender,
      patientId,
    });
  };

  return (
    <div className="run-test-overlay">
      <div className="run-test-container">
        <header className="run-test-header">
          <h2>Run Test</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </header>
        <hr />
        <main className="run-test-content">
          <form onSubmit={handleSubmit}>
            <p className="smear">Select Smear Type:</p>
            <div className="options">
              <div className="left">
                <input
                  type="radio"
                  id="thin"
                  name="smearType"
                  value="thin"
                  checked={smearType === 'thin'}
                  onChange={(e) => setSmearType(e.target.value)}
                />
                <label htmlFor="thin">Thin</label>
              </div>
              <div className="right">
                <input
                  type="radio"
                  id="thick"
                  name="smearType"
                  value="thick"
                  checked={smearType === 'thick'}
                  onChange={(e) => setSmearType(e.target.value)}
                />
                <label htmlFor="thick">Thick</label>
              </div>
            </div>
            <br />
            <h5>Patient Demographics:</h5>
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                type="text"
                placeholder="Enter Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="two">
              <div className="form-group">
                <label htmlFor="age">Age</label>
                <input
                  id="age"
                  type="number"
                  placeholder="eg 42"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  required
                />
              </div>
              <div className="form-group" id='gender'>
                <label htmlFor="gender">Gender</label>
                <select
                  id="gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  required
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="others">Others</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="patientId">Patient ID</label>
              <input
                id="patientId"
                type="text"
                placeholder="Enter Patient ID"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                required
              />
            </div>
            <hr />
            <button className="run-btn" type="submit">
              Run Test
            </button>
          </form>
        </main>
      </div>
    </div>
  );
};

export default RunTest;