import React, { useState } from 'react';
import './run.css';
import Prompt from './prompt';

const RunTest = ({ patient, onClose, onSave,refresh }) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [name, setName] = useState(patient?.name || '');
  const [age, setAge] = useState(patient?.age || '');
  const [gender, setGender] = useState(patient?.gender || '');
  const [patientId, setPatientId] = useState(patient?.id || '');
  const [date] = useState(patient?.date || new Date().toISOString().split('T')[0]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const updatedPatient = {
      id: patientId,
      name,
      age: Number(age),
      gender,
      date,
    };

    // EDIT MODE
    if (patient && typeof onSave === "function") {
      await onSave(updatedPatient);
      onClose();
      return;
    }

    // ADD MODE
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

  // ⭐ REFRESH PATIENT LIST IMMEDIATELY
  if (typeof refresh === "function") refresh();

  onClose();
} catch (err) {
  console.error(err);
}

  };

  const handleCloseClick = () => setShowPrompt(true);

  return (
    <div className="run-test-overlay">
      <div className="run-test-container">
        <header className="run-test-header">
          <h4>{patient ? "Edit Patient" : "Add Patient's Demographics"}</h4>
          <button className="close-button" onClick={handleCloseClick} type="button">×</button>
        </header>
        <hr />
        <main className="run-test-content">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name" className="lsmear">Name:</label>
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
                <label htmlFor="age" className="lsmear">Age:</label>
                <input
                  id="age"
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  required
                />
              </div>

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

            <div className="form-group">
              <label htmlFor="patientId" className="lsmear">ID:</label>
              <input
                id="patientId"
                type="text"
                placeholder="Enter Patient's ID"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                required
              />
            </div>

            {/* Hide date in edit mode */}
            {!patient && (
              <>
               <br/><br/>
              </>
            )}

            <hr />
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
      </div>
    </div>
  );
};

export default RunTest;