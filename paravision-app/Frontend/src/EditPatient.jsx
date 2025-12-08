import React, { useState } from "react";
import "./run.css";

const EditPatient = ({ patient, onClose, onPatientUpdated }) => {
  const [name, setName] = useState(patient.name);
  const [age, setAge] = useState(patient.age);
  const [gender, setGender] = useState(patient.gender);
  const [patientId, setPatientId] = useState(patient.id);
  const [date, setDate] = useState(patient.date);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const updated = {
      id: patientId,
      name,
      age: Number(age),
      gender,
      date,
    };

    try {
      const res = await fetch(`http://localhost:8000/api/patients/${patient.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });

      if (!res.ok) {
        alert("Update failed.");
        return;
      }

      onPatientUpdated(updated); // send updated patient back
      onClose(); // close modal
    } catch (err) {
      console.error(err);
      alert("Error updating patient.");
    }
  };

  return (
    <div className="run-test-overlay">
      <div className="run-test-container">
        <header className="run-test-header">
          <h4>Edit Patient</h4>
          <button className="close-button" onClick={onClose}>×</button>
        </header>
        <hr />

        <form onSubmit={handleSubmit}>
          <label>Name:</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required />

          <label>Age:</label>
          <input type="number" value={age} onChange={(e) => setAge(e.target.value)} required />

          <label>Gender:</label>
          <select value={gender} onChange={(e) => setGender(e.target.value)} required>
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Others">Others</option>
          </select>

          <label>ID:</label>
          <input value={patientId} onChange={(e) => setPatientId(e.target.value)} required />

          <label>Date of Entry:</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />

          <button className="run-btn" type="submit">Update</button>
        </form>
      </div>
    </div>
  );
};

export default EditPatient;
