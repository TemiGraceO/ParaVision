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
        <ul className='about'>
         <li>Fast</li>
          <li>More Accurate</li>
        </ul>
        <ul className='only'>
          <li>Efficient</li>
        </ul>
        <div className='explain'>
        <p>ParaVision is an innovation project from TeamABU 2025/2026.</p>
        <p>This project aims at empowering lab technicians is the testing phase of medical works.</p>
        <p>ParaVision is tailored for use on children and toddlers samples.</p>
        </div>
    </div>
  );
};

export default About;