import React, { useState} from 'react';
import './data.css'

const Data = ({ onClose }) => {
  const [closing, setClosing] = useState(false);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      onClose();
    }, 300); // wait for the animation to complete
  };

  return (
    <div className={`data-container ${closing ? 'slide-out' : ''}`}>
        <button onClick={handleClose} className='btn2'>X</button>
      <h3 className='data'>Data Analytics</h3><hr/><br/>
      <p>Comprehensive overview of diagnostic data, trends and system performance.</p>
    </div>
  );
};

export default Data;