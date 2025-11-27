import React, { useState} from 'react';
import './history.css'

const History = ({ onClose }) => {
  const [closing, setClosing] = useState(false);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      onClose();
    }, 300); // wait for the animation to complete
  };

  return (
    <div className={`history-container ${closing ? 'slide-out' : ''}`}>
        <button onClick={handleClose} className='btn2'>X</button>
      <h3 className='data'>Review History</h3><hr/><br/>
      <p>Review a chronological log of all significant acticities and changes </p>
    </div>
  );
};

export default History;