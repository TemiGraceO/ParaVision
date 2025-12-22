import React, { useState} from 'react';
import './about.css';

const About = ({ onClose }) => {
  const [closing, setClosing] = useState(false);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  return (
    <div className={`about-container ${closing ? 'slide-out' : ''}`}>

      <div className='abt'><h5>ParaVision</h5>
             <button onClick={handleClose} className='x'>X</button></div>
      <video width="300" height="200" controls>
        <source src="ParaVision Demo.mp4" type="video/mp4" />
        Your browser does not support the video tag.</video>
        <ul className='about'><b>
         <li><span className='only'>Fast</span></li>
          <li><span className='only'>More Accurate</span></li>
          <li><span className='only'>Efficient</span></li></b>
        </ul>
        <div className='explain'>
        <p>ParaVision is an innovation project from TeamABU 2025/2026. This project aims at empowering lab technicians is the testing phase of medical works.</p>
        <br/><p>ParaVision is tailored for use on children and toddlers samples.</p>
        </div>
    </div>
  );
};

export default About;