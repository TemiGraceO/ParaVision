import React, { useState } from 'react';
import './run.css';
import Prompt from './prompt';

const RunTest = ({ onClose, refresh }) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [patientId, setPatientId] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { id: patientId, name, age: Number(age), gender };
    try {
      const res = await fetch('http://localhost:8000/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        alert("Added! 🎉");
        refresh(); // Updates list without reload
        onClose();
      } else {
        alert("Error! Check ID.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCloseClick = () => {
    setShowPrompt(true); // Opens Prompt.js
  };

  return (
    <div className="run-test-overlay">
      <div className="run-test-container">
        <header className="run-test-header">
          <h4>Add Patient's Demographics</h4>
          <button
            className="close-button"
            onClick={handleCloseClick}
            type="button"
          >
            ×
          </button>
        </header>
        <hr />
        <main className="run-test-content">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name" className='lsmear'>Name:</label>
              <input id="name" type="text" placeholder="Enter Patient's Full name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="two">
              <div className="form-group">
                <label htmlFor="age" className='lsmear'>Age:</label>
                <input id="age" type="number" placeholder="eg 42" value={age} onChange={(e) => setAge(e.target.value)} required />
              </div>
              <div className="form-group" id='gender'>
                <label htmlFor="gender" style={{ paddingLeft: 20 }} className='lsmear'>Gender:</label>
                <select id="gender" value={gender} onChange={(e) => setGender(e.target.value)} required>
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="others">Others</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="patientId" className='lsmear'>ID:</label>
              <input id="patientId" type="text" placeholder="Enter Patient's ID" value={patientId} onChange={(e) => setPatientId(e.target.value)} required />
            </div>
            <label htmlFor="date" className='lsmear'>Date of entry:</label><br />
            <input type='date' className='date' /><br /><br />
            <hr />
            <div className='btn100'>
              <button className="run-btn" type="submit">Add to record</button>
            </div>
          </form>
        </main>
        {showPrompt && (
          <Prompt
            onClose={() => setShowPrompt(false)}
            closeRunTest={onClose} // Closes RunTest if "Yes"
          />
        )}
      </div>
    </div>
  );
};

export default RunTest;