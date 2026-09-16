import React, { useState } from 'react';
import './about.css';

const About = ({ onClose }) => {
  const [closing, setClosing] = useState(false);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      onClose();
    }, 300); // Match this with your CSS transition duration
  };

  return (
    <div className={`about-overlay ${closing ? 'slide-out' : ''}`}>
      <div className="about-card">
        <header className="about-header">
          <h2>ParaVision</h2>
          <button onClick={handleClose} className="close-btn">
            x
          </button>
        </header>

        <div className="about-content">
          <video width="100%" controls>
            <source src="ParaVision Demo.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>

          <ul className="about-list">
            <li><span className="highlight">Fast</span></li>
            <li><span className="highlight">More Accurate</span></li>
            <li><span className="highlight">Efficient</span></li>
          </ul>

          <div className="about-explanation">
            <p>
              ParaVision is an innovation project from TeamABU 2025/2026. This project aims at empowering lab technicians during the testing phase of medical workflows.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;