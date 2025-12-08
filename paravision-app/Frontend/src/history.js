import React, { useState, useEffect } from 'react';
import './history.css';

const Config = ({ onClose }) => {
  const [isEditable, setIsEditable] = useState(true);
  const [closing, setClosing] = useState(false);
  const [hospitalName, setHospitalName] = useState('');
  const [hospitalNumber, setHospitalNumber] = useState('');
  const [labId, setLabId] = useState('');
  const [language, setLanguage] = useState('English (Default)');
  const [address, setAddress] = useState('');
  const [country, setCountry] = useState('');
  const [testBy, setTestBy] = useState('');
  const handleEdit = () => {
  setIsEditable(true);
};

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => onClose(), 300);
  };
  useEffect(() => {
  fetch("http://localhost:8000/api/config")
    .then(res => res.json())
    .then(data => {
      if (data && Object.keys(data).length > 0) {
        setHospitalName(data.hospitalName || "");
        setHospitalNumber(data.hostpitalID || "");
        setLabId(data.labId || "");
        setAddress(data.address || "");
        setTestBy(data.testBy || "");

        // If config exists → inputs should NOT be editable
        setIsEditable(false);
      }
    });
}, []);


  const handleSave = async () => {
  const configData = {
    hospitalName,
    hostpitalID: Number(hospitalNumber),
    labId: Number(labId),
    address,
    testBy
  };

  await fetch("http://localhost:8000/api/config", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(configData)
  });

  alert("Configuration saved!");

  // Lock the fields
  setIsEditable(false);
};



  

  return (
    <div className={`config-modal-overlay ${closing ? 'cm-slide-out' : ''}`}>
      <div className="config-modal-content">
        <h3 className="cm-title">Application Configurations</h3>
        <button onClick={handleClose} className="cm-close-btn">×</button>

        <div className='top1'>
          <p className="cm-subtitle">Manage your hospital’s settings.</p>

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="opt1"
          >
            <option>English (Default)</option>
            <option>Chinese</option>
            <option>French</option>
          </select>
        </div>

        <div className="cm-form">
          <label>Hospital Name:</label>
          <input
            type="text"
            value={hospitalName}
            onChange={(e) => setHospitalName(e.target.value)}
            className="cm-input"
            disabled={!isEditable}
          />

          {/* HOSPITAL NUMBER + LAB ID IN SAME ROW */}
          <div className="cm-row">
            <div className="cm-half">
              <label>Hospital Number:</label>
              <input
                type="number"
                value={hospitalNumber}
                onChange={(e) => setHospitalNumber(e.target.value)}
                className="cm-input"
                disabled={!isEditable}
              />
            </div>

            <div className="cm-half">
              <label>Lab ID:</label>
              <input
                type="number"
                value={labId}
                onChange={(e) => setLabId(e.target.value)}
                className="cm-input"
                disabled={!isEditable}
              />
            </div>
          </div>

          <label>Address:</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="cm-input"
            disabled={!isEditable}
          />

          <label>Country:</label>
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="cm-input"
            disabled={!isEditable}
          />

          <label>Test By:</label>
          <input
            type="text"
            value={testBy}
            onChange={(e) => setTestBy(e.target.value)}
            className="cm-input"
            disabled={!isEditable}
          />
        </div>

        <div className="button-container">
          <button onClick={handleSave} className="cm-save-btn">Save Changes</button>
          <button onClick={handleEdit} className="cm-save-btn">Edit</button>
        </div>
      </div>
    </div>
  );
};

export default Config;
