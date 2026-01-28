import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { FaBackspace, FaArrowLeft, FaCheck } from "react-icons/fa";
import Keyboard from 'react-simple-keyboard';
import 'react-simple-keyboard/build/css/index.css';
import './run.css';
import Prompt from './prompt';
import { v4 as uuidv4 } from 'uuid';

const RunTest = ({ patient, onClose, onSave, refresh }) => {
  const [showPrompt, setShowPrompt] = useState(false);

  const [name, setName] = useState(patient?.name || '');
  const [dob, setDob] = useState(patient?.dob || '');
  const [gender, setGender] = useState(patient?.gender || '');
  const [patientId, setPatientId] = useState(patient?.id || '');
  const [date] = useState(patient?.date || new Date().toISOString().split('T')[0]);

  // Onscreen keyboard state
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [activeInput, setActiveInput] = useState(null); // "name" or "id"
  const keyboardRef = useRef(null);

  // Hide keyboard if click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (keyboardRef.current && !keyboardRef.current.contains(e.target)) {
        setShowKeyboard(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowKeyboard(false); // hide keyboard on submit

    const updatedPatient = {
  id:patientId, // generate new ID if adding
  name,
  dob,
  gender,
  date
};

    // EDIT MODE
    if (patient && typeof onSave === "function") {
      await onSave(updatedPatient);
      onClose();
      return;
    }

    // ADD MODE
    try {
      const res = await fetch("http://localhost:8000/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedPatient),
      });

      if (!res.ok) {
        alert("Failed to add patient");
        return;
      }

      if (typeof refresh === "function") refresh();
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCloseClick = () => setShowPrompt(true);

  // **Keyboard Portal JSX**
  const keyboardPortal = showKeyboard && ReactDOM.createPortal(
    <div className="keyboard-portal" ref={keyboardRef}>
      <Keyboard
        onChange={(input) => {
          if (activeInput === "name") setName(input);
          if (activeInput === "id") setPatientId(input);
        }}
        value={activeInput === "name" ? name : patientId}
      />
    </div>,
    document.body
  );

  return (
    <div className="run-test-overlay">
      <div className="run-test-container">
        <header className="run-test-header">
          <h4>{patient ? "Edit Patient" : "Add Patient's Demographics"}</h4>
          <button className="close-button" onClick={handleCloseClick} type="button">x</button>
        </header>
        <hr />
        <main className="run-test-content">
          <form onSubmit={handleSubmit}>
            {/* NAME */}
            <div className="form-group">
              <label htmlFor="name" className="lsmear">Name:</label>
              <input
                id="name"
                type="text"
                placeholder="Enter Patient's Full name"
                value={name}
                onFocus={() => { setShowKeyboard(true); setActiveInput("name"); }}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="two">
              {/* DOB */}
              <div className="form-group">
                <label htmlFor="dob" className="lsmear">DOB:</label>
                <input
                  id="dob"
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  required
                />
              </div>

              {/* GENDER */}
              <div className="form-group" id="gender">
                <label htmlFor="gender" className="lsmear" style={{paddingLeft:20}}>Gender:</label>
                <select
                  id="gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  required
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Others">Others</option>
                </select>
              </div>
            </div>

            {/* PATIENT ID */}
            <div className="form-group">
              <label htmlFor="patientId" className="lsmear">ID:</label>
              <input
                id="patientId"
                type="text"
                placeholder="Enter Patient's ID"
                value={patientId}
                onFocus={() => { setShowKeyboard(true); setActiveInput("id"); }}
                onChange={(e) => setPatientId(e.target.value)}
                required
              />
            </div>

            <hr /><br/>
            <div className="btn100">
              <button className="run-btn" type="submit">
                {patient ? "Update" : "Add to record"}
              </button>
            </div>
          </form>
        </main>

        {showPrompt && (
          <Prompt
            onClose={() => setShowPrompt(false)}
            closeRunTest={onClose}
          />
        )}

        {keyboardPortal} {/* render keyboard portal */}
      </div>
    </div>
  );
};

export default RunTest;
