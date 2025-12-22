import React from 'react';
import './prompt.css';

const Prompt = ({ onClose, closeRunTest }) => {
  const handleYes = () => {
    console.log("Closing RunTest...");
    closeRunTest(); 
    onClose();
  };

  return (
    <div className="prompt-overlay">
      <div className="prompt-box">
        <h4>Exit ?</h4>
        <p>Changes will not be saved.</p><br/>
        <div className='btnw'>
          <button onClick={handleYes}>Yes</button>
          <button onClick={onClose}>No</button>
        </div>
      </div>
    </div>
  );
};

export default Prompt;