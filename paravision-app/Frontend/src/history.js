import React, { useState } from 'react';
import './history.css';

const Config = ({ onClose }) => {
  const [closing, setClosing] = useState(false);
  const [hospitalName, setHospitalName] = useState('Your Hospital Name');
  const [testTypes, setTestTypes] = useState(['Blood', 'Stool', 'Blood + Stool']);
  const [newTestType, setNewTestType] = useState('');

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => onClose(), 300);
  };

  const handleAddTestType = () => {
    if (newTestType) {
      setTestTypes([...testTypes, newTestType]);
      setNewTestType('');
    }
  };

  const handleRemoveTestType = (type) => {
    setTestTypes(testTypes.filter((t) => t !== type));
  };

  return (
    <div className={`config-modal-overlay ${closing ? 'cm-slide-out' : ''}`}>
      <div className="config-modal-content">
        <button onClick={handleClose} className="cm-close-btn">×</button>
        <h3 className="cm-title">Application Configurations</h3>
        <hr /><br/>
        <p className="cm-subtitle">Manage your hospital's settings and preferences.</p>
        <div className="cm-form">
          <label>Hospital Name:</label>
          <input
            type="text"
            value={hospitalName}
            onChange={(e) => setHospitalName(e.target.value)}
            className="cm-input"
          />
        </div>
        <div className="cm-form">
          <label>Test Types:</label>
          <ul>
            {testTypes.map((type) => (
              <li key={type}>
                {type}
                <button onClick={() => handleRemoveTestType(type)} className="cm-remove-btn">Remove</button>
              </li>
            ))}
          </ul>
          <input
            type="text"
            value={newTestType}
            onChange={(e) => setNewTestType(e.target.value)}
            className="cm-input"
            placeholder="Add new test type"
          />
          <button onClick={handleAddTestType} className="cm-add-btn">Add Test Type</button>
        </div>
        <button className="cm-save-btn">Save Changes</button>
      </div>
    </div>
  );
};

export default Config;