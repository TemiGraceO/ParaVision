import React, { useEffect, useState } from 'react';
import './first_one.css';
import About from './about';

function SplashPage() {
  const [showAbout, setShowAbout] = useState(false);

  const handleAboutClick = () => {
    setShowAbout(true);
  };

  const handleCloseAbout = () => {
    setShowAbout(false);
  };

  useEffect(() => {
    const loaderBar = document.querySelector('.loader-bar');
    const logo = document.querySelector('.logo');
    const splashPage = document.querySelector('.splash-page');
    const firstPage = document.querySelector('.first');

    loaderBar.style.width = '0%';
    let progress = 0;
    const intervalId = setInterval(() => {
      progress += 10;
      loaderBar.style.width = `${progress}%`;
      if (progress >= 100) {
        clearInterval(intervalId);
        logo.classList.add('animate-up');
        splashPage.classList.add('animate-out');
        setTimeout(() => {
          firstPage.classList.add('animate-in');
        }, 400); // wait for 0.5s before fading in .first
      }
    }, 400);
  }, []);

  return (
    <>
      <div className='splash-page main'>
        <div className="words">
          <h1 className='move'>
            <div className="logo">
              <img src='logo2.png' alt='paravision logo' style={{ width: '15%' }} />
              <span id="main">ParaVision</span>
            </div>
            <span className="down">Empowering Precision Diagnostics</span>
          </h1>
          <br></br>
          <div className="loader-container">
            <div className="loader-bar"></div>
          </div>
        </div>
        <div>
          <div className='particles'>
            <img src='red.png' alt='a single red blood cell' className='particle1' style={{ width: '10%' }} />
          </div>
          <img src="microscope.png" alt="Microscope" style={{ width: '150%', filter: 'drop-shadow(8px 1px rgba(2,8,26,0.3))' }} />
          <div className="a"><h5>TeamABU 2025/2026</h5></div>
        </div>
        <div className="next-interface"> </div>
      </div>
      <div className='first'>
        <div className='up'>
          <img src='logo2.png' alt='logo' style={{ width: '3%', marginLeft: '3%' }} />
          <div><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className='toggle'>
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg></div>
        </div><hr />
        <div className='mid'>
          <div className='left'>
            <h1>Precision Diagnostics,Redefined</h1>
            <p> ParaVision offers cutting-edge tools for accurate and <br /> efficient cellular analysis, empowering you to make<br /> a confident decision </p>
            <button className='btn' onClick={handleAboutClick}>About App</button>
          </div>
        </div>
        <div className='third'>
          <h2>Core Functionalities</h2>
        </div>
        <div className="horizontal-layout">
          <div className="item">
            <h5><svg width="40" height="30" viewBox="0 0 24 24" fill="none" stroke="#0d6efd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 3h6"></path>
              <path d="M10 3v12a4 4 0 1 0 4 0V3"></path>
              <line x1="9" y1="9" x2="15" y2="9"></line>
            </svg><br />Run Test</h5><p>Initialize new tests with precision and speed</p>
          </div>
          <div className="item"><svg width="44" height="30" viewBox="0 0 24 24" fill="none" stroke="#0d6efd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M5 21v-2a4 4 0 0 1 8 0v2"></path>
            <line x1="16" y1="10" x2="22" y2="10"></line>
            <line x1="16" y1="14" x2="22" y2="14"></line>
            <line x1="16" y1="18" x2="22" y2="18"></line>
          </svg> <br /><h5>Patients Management</h5><p>Easily view, add and merge patients records</p></div>
          <div className="item"><h5><svg width="40" height="30" viewBox="0 0 24 24" fill="none" stroke="#0d6efd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10"></polyline>
            <path d="M3.51 15a9 9 0 1 0 .49-9"></path>
            <line x1="12" y1="7" x2="12" y2="12"></line>
            <line x1="12" y1="12" x2="15" y2="15"></line>
          </svg> <br />Review History</h5><p>Access past test results of patients</p></div>
          <div className="item"><h5><svg width="48" height="30" viewBox="0 0 24 24" fill="none" stroke="#0d6efd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="20" x2="4" y2="10"></line>
            <line x1="10" y1="20" x2="10" y2="4"></line>
            <line x1="16" y1="20" x2="16" y2="14"></line>
            <polyline points="3 6 10 12 16 8 21 14"></polyline>
          </svg><br />Data Analytics</h5><p>Visualize trends and gain statistical insights</p></div>
          <div className="item"><h5><svg width="48" height="30" viewBox="0 0 24 24" fill="none" stroke="#0d6efd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="20" x2="4" y2="10"></line>
            <line x1="10" y1="20" x2="10" y2="4"></line>
            <line x1="16" y1="20" x2="16" y2="14"></line>
            <polyline points="3 6 10 12 16 8 21 14"></polyline>
          </svg><br />Data Analytics</h5><p>Visualize trends and gain statistical insights</p></div>
          <div className="item"><h5><svg width="48" height="30" viewBox="0 0 24 24" fill="none" stroke="#0d6efd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="20" x2="4" y2="10"></line>
            <line x1="10" y1="20" x2="10" y2="4"></line>
            <line x1="16" y1="20" x2="16" y2="14"></line>
            <polyline points="3 6 10 12 16 8 21 14"></polyline>
          </svg><br />Data Analytics</h5><p>Visualize trends and gain statistical insights</p></div>
        </div>
        <div className='footer'>TeamABU2025/2026</div>
      </div>
      {showAbout && (
        <div className="about-overlay" onClick={handleCloseAbout}>
          <About onClose={handleCloseAbout} />
        </div>
      )}
    </>
  );
}

export default SplashPage;