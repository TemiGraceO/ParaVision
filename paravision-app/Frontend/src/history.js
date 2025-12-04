import React, { useState } from 'react';
import './history.css';

const Config = ({ onClose }) => {
  const [closing, setClosing] = useState(false);
  const [hospitalName, setHospitalName] = useState('Your Hospital Name');
  const [hospitalNumber, setHospitalNumber] = useState('');
  const [labId, setLabId] = useState('');
  const [testTypes, setTestTypes] = useState(['Blood', 'Stool', 'Blood + Stool']);
  const [newTestType, setNewTestType] = useState('');
  const [language, setLanguage] = useState('English (Default)');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => onClose(), 300);
  };

  const handleAddTestType = () => {
    if (newTestType) {
      setTestTypes([...testTypes, newTestType]);
    }
  };

  const handleRemoveTestType = (type) => {
    setTestTypes(testTypes.filter((t) => t !== type));
  };

  const handleSave = () => {
    // Save the configurations
    console.log('Configurations saved');
  };

  return (
    <div className={`config-modal-overlay ${closing ? 'cm-slide-out' : ''}`}>
      <div className="config-modal-content">
        <h3 className="cm-title">Application Configurations</h3>
        <button onClick={handleClose} className="cm-close-btn">×</button>
        <hr /><br/>
        <div className='top1'>
          <p className="cm-subtitle">Manage your hospital's settings.</p>
          <select value={language} onChange={(e) => setLanguage(e.target.value)} className='opt1'>
            <option>English (Default)</option>
            <option>Chinese</option>
            <option>French</option>
          </select>
        </div>
        <div className="cm-form">
          <label>Hospital Name:</label>
          <input type="text" value={hospitalName} onChange={(e) => setHospitalName(e.target.value)} className="cm-input" />
          <label>Hospital Number:</label>
          <input type="number" value={hospitalNumber} onChange={(e) => setHospitalNumber(e.target.value)} className="cm-input" />
          <label>Lab ID:</label>
          <input type="number" value={labId} onChange={(e) => setLabId(e.target.value)} className="cm-input" />
          <label>Address:</label>
          <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="cm-input" />
          <label>Country:</label>
          <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} className="cm-input" />
          <label>Email:</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="cm-input" />
        </div>
        <div className="button-container">
          <button onClick={handleSave} className="cm-save-btn">Save Changes</button>
        </div>
      </div>
    </div>
  );
};

export default Config;