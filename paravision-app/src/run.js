import React, { useState } from 'react';
import './run.css';

const RunTest = () => {
  const [showRunTest, setShowRunTest] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const handleClose = () => setShowPrompt(true);
  const handleNo = () => setShowPrompt(false);
  const handleYes = () =>{
    setShowPrompt(false);
    window.close();
  };

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [patientId, setPatientId] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission here
    console.log({
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
          <h4>Add Patient's Demographics</h4>
          <button className="close-button" onClick={handleClose}>
            ×
          </button>
        </header>
        <hr />
        <main className="run-test-content">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name" className='lsmear'>Name:</label>
              <input
                id="name"
                type="text"
                placeholder="Enter Patient's Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="two">
              <div className="form-group">
                <label htmlFor="age" className='lsmear'>Age:</label>
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
                <label htmlFor="gender" style={{paddingLeft:20}} className='lsmear'>Gender:</label>
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
              <label htmlFor="patientId" className='lsmear'>ID:</label>
              <input
                id="patientId"
                type="text"
                placeholder="Enter Patient's ID"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                required
              />
            </div>
            <label htmlFor="date"className='lsmear'>Date of entry:</label><br/><input type='date' className='date'></input><br/><br/>
            <hr />
            <div className='btn100'>
            <button className="run-btn" type="submit">
              Add to record
            </button></div>
          </form>
        </main>
        {showPrompt && (
          <div className='modal'>
            <p>Are You Sure You want to quit? Inputs won't be saved</p>
            <div className='btn200'>
            <button onClick={handleYes} >Yes</button>
            <button onClick={handleNo}>No</button></div>
            </div>
        )}
      </div>
    </div>
  );
};

export default RunTest;