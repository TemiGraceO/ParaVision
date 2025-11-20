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
        <button onClick={handleClose} className='btn2'>X</button>
      <h3>About ParaVision</h3><br/>
      <video width="300" height="200" controls>
        <source src="ParaVision Demo.mp4" type="video/mp4" />
        Your browser does not support the video tag.</video>
    </div>
  );
};

export default About;