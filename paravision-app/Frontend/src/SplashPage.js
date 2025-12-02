import React, { useEffect, useState } from 'react';
import './first_one.css';
import About from './about';
import RunTest from './run';
import Patient from './patient';
import Data from './data';
import History from './history';

function SplashPage() {
  const [showHistory, setShowHistory] = useState(false);
  const [showData, setShowData] = useState(false);  
  const [showAbout, setShowAbout] = useState(false);
  const [showRunTest, setShowRunTest] = useState(false);
  const [showPatient, setShowPatient] = useState(false);

  const handleHistoryClick = () => {
    setShowHistory(true);
  };

  const handleCloseHistory = () => {
    setShowHistory(false); 
  };

  const handleDataClick = () => {
    setShowData(true);
  };

  const handleCloseData = () => {
    setShowData(false);
  };
  

  const handleAboutClick = () => {
    setShowAbout(true);
  };

  const handleCloseAbout = () => {
    setShowAbout(false);
  };


   const handleCloseRunTest = () => {
    setShowRunTest(false);
  };
  const handlePatientClick = () => {
    setShowPatient(true);
  };
const handleClosePatientClick = () => {
    setShowPatient(false);
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
        }, 200); // wait for 0.5s before fading in .first
      }
    }, 300);
  }, []);

  return (
    <>
      <div className='splash-page'>
        <div>
          <h1>
            <div className="logo">
              <img src='logo2.png' alt='paravision logo'style={{ width: '10%' }} className='abc' />
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
          <img className='image' src="paravision.png" alt="Microscope" style={{ width: '80%'}} />
        </div>
        <div className="next-interface"> </div>
      </div><div><footer>TeamABU@2025/2026</footer></div>



      <div className='first'>
        <div className='up'>
          <img src='logo2.png' alt='logo' style={{ width: '3%', zIndex:'10000'}} className='ab'/>
           <button className='btna' onClick={handleAboutClick}>About App</button>
        </div>
          <div className='left'>
            <div className='left1'>
            <h1>Precision Diagnostics,Redefined</h1>
            <p> ParaVision offers cutting-edge tools for accurate and efficient cellular analysis, empowering you to make a confident decision </p></div>
           <div><img src='test.png' alt='paravision logo'className='test' /></div>
          </div>
        <div className='third'>
          <h2>Core Functionalities</h2>
        </div>
        <div className="horizontal-layout">
  <div className="item" onClick={handlePatientClick}>
    <svg width="44" height="30" viewBox="0 0 24 24" fill="none" stroke="#143d3eff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M5 21v-2a4 4 0 0 1 8 0v2"></path>
      <line x1="16" y1="10" x2="22" y2="10"></line>
      <line x1="16" y1="14" x2="22" y2="14"></line>
      <line x1="16" y1="18" x2="22" y2="18"></line>
    </svg>
    <h5>Patients Management</h5>
    <p>Easily view and add patients records</p>
    <button className='btn1'>Manage Patients</button>
  </div>
  <div className="item" onClick={handleDataClick}>
    <h5>
      <svg width="48" height="30" viewBox="0 0 24 24" fill="none" stroke="rgb(55, 113, 114)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="4" y1="20" x2="4" y2="10"></line>
        <line x1="10" y1="20" x2="10" y2="4"></line>
        <line x1="16" y1="20" x2="16" y2="14"></line>
        <polyline points="3 6 10 12 16 8 21 14"></polyline>
      </svg>
      <br />Data Analytics
    </h5>
    <p>Visualize trends and statistics easily</p>
    <button className='btn1'>View Analytics</button>
  </div>
  <div className="item" onClick={handleHistoryClick}>
        <h5>
      <svg width="40" height="30" viewBox="0 0 24 24" fill="none" stroke="#143d3eff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="1 4 1 10 7 10"></polyline>
        <path d="M3.51 15a9 9 0 1 0 .49-9"></path>
        <line x1="12" y1="7" x2="12" y2="12"></line>
        <line x1="12" y1="12" x2="15" y2="15"></line>
      </svg>
      <br />Review History
    </h5>
    <p>Access past test results of patients</p>
    <button className='btn1'>Access History</button>
  </div>
</div>
      </div>
      {showAbout && (
  <div className="about-overlay">
    <About onClose={handleCloseAbout} />
  </div>
)}

{showRunTest && (
  <div className="run-test-overlay-wrapper">
    <RunTest onClose={handleCloseRunTest} />
  </div>
)}
{showPatient && (
  <div className="patient-overlay">
    <Patient onClose={handleClosePatientClick} />
  </div>
)}
{showData && (
  <div className="data-overlay">
    <Data onClose={handleCloseData} />
  </div>
)}
{showHistory && (
  <div className="history-overlay">
    <History onClose={handleCloseHistory} />
  </div>
)}
   
    </> 
  );
}

export default SplashPage;