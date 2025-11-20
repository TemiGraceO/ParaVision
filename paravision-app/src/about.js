import React, { useState, useEffect } from 'react';

const About = ({ onClose }) => {
  const [closing, setClosing] = useState(false);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      onClose();
    }, 300); // wait for the animation to complete
  };

  return (
    <div className={`about-container ${closing ? 'slide-out' : ''}`}>
      <h2>About App<button onClick={handleClose} className='btn2'>X</button></h2>
      
    </div>
  );
};

export default About;