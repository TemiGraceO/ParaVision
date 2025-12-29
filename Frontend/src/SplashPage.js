import React, { useEffect, useState } from 'react';
import './first_one.css';
import About from './about';
import RunTest from './run';
import Patient from './patient';
import Data from './data';
import Config from './history';
import MalariaTest from './malaria';

function SplashPage() {
  // ---------------- TYPEWRITER EFFECT ----------------
  const words = ["Redefined.", "Reinvented.", "Transformed.", "Elevated."];
  const [displayedText, setDisplayedText] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = words[wordIndex];
    const speed = isDeleting ? 80 : 120;

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        setDisplayedText(current =>
          currentWord.substring(0, current.length + 1)
        );

        if (displayedText === currentWord) {
          setTimeout(() => setIsDeleting(true), 1200);
        }

      } else {
        setDisplayedText(current =>
          current.substring(0, current.length - 1)
        );

        if (displayedText === "") {
          setIsDeleting(false);
          setWordIndex((wordIndex + 1) % words.length);
        }
      }
    }, speed);

    return () => clearTimeout(timeout);
  }, [displayedText, isDeleting, wordIndex]);
  // ----------------------------------------------------

  // ---------------- MODAL CONTROLS --------------------
  const [showHistory, setShowHistory] = useState(false);
  const [showData, setShowData] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showRunTest, setShowRunTest] = useState(false);
  const [showPatient, setShowPatient] = useState(false);
  const [currentView, setCurrentView] = useState('main'); // 'main', 'malaria', 'stool', 'both'
  const [activeTest, setActiveTest] = useState(null);

  const handleHistoryClick = () => setShowHistory(true);
  const handleCloseHistory = () => setShowHistory(false);

  const handleDataClick = () => setShowData(true);
  const handleCloseData = () => setShowData(false);

  const handleAboutClick = () => setShowAbout(true);
  const handleCloseAbout = () => setShowAbout(false);

  const handleRunTestClick = () => setShowRunTest(true);
  const handleCloseRunTest = () => setShowRunTest(false);

  const handlePatientClick = () => setShowPatient(true);
  const handleClosePatientClick = () => setShowPatient(false);
  // ----------------------------------------------------

  // ---------------- NAVIGATION LISTENERS ----------------
  useEffect(() => {
    const handleMalaria = (testData) => {  // Changed to accept only testData
      console.log("Received malaria navigation event:", testData);
      setActiveTest(testData);
      setCurrentView('malaria');
    };

    const handleStool = (testData) => {  // Changed to accept only testData
      console.log("Received stool navigation event:", testData);
      setActiveTest(testData);
      setCurrentView('stool');
    };

    const handleBoth = (testData) => {  // Changed to accept only testData
      console.log("Received both navigation event:", testData);
      setActiveTest(testData);
      setCurrentView('both');
    };

    // Attach listeners
    if (window.electronAPI) {
      console.log("Attaching Electron listeners...");
      window.electronAPI.onNavigateToMalaria(handleMalaria);
      window.electronAPI.onNavigateToStool(handleStool);
      window.electronAPI.onNavigateToBoth(handleBoth);
    } else {
      console.warn("window.electronAPI is not available");
    }

    // Cleanup listeners on unmount
    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeAllListeners('navigate-to-malaria');
        window.electronAPI.removeAllListeners('navigate-to-stool');
        window.electronAPI.removeAllListeners('navigate-to-both');
      }
    };
  }, []);
  // ----------------------------------------------------

  // ---------------- SPLASH INTRO ANIMATION ----------------
  useEffect(() => {
    const loaderBar = document.querySelector('.loader-bar');
    const logo = document.querySelector('.logo');
    const splashPage = document.querySelector('.splash-page');
    const firstPage = document.querySelector('.first');

    if (loaderBar && logo && splashPage && firstPage) {
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
          }, 400);
        }
      }, 400);
    }
  }, []);
  // --------------------------------------------------------

  // Handler for when a test is completed or closed in MalariaTest
  const handleMalariaTestClose = () => {
    setCurrentView('main');
    setActiveTest(null);
  };

  // Handler for when a test is completed in MalariaTest
  const handleMalariaTestComplete = (finalResults) => {
    console.log("Malaria test completed with results:", finalResults);
    handleMalariaTestClose();
  };

  // Add a button to trigger the RunTest modal in your layout
  const handleRunTest = () => {
    setShowRunTest(true);
  };

  return (
    <>
      {/* -------- SPLASH SCREEN -------- */}
      {currentView === 'main' && !activeTest && (
        <div className='splash-page'>
          <div>
            <h1>
              <div className="logo">
                <img src='logo2.png' alt='paravision logo' style={{ width: '10%' }} className='abc' />
                <span id="main">ParaVision</span>
              </div>
              <span className="down">Empowering Precision Diagnostics</span>
            </h1>

            <div className="loader-container">
              <div className="loader-bar"></div>
            </div>
          </div>

          <div>
            <img className='image' src="paravision.png" alt="Microscope" style={{ width: '90%' }} />
          </div>
          <div><footer>TeamABU@2025/2026</footer></div>
        </div>
      )}

      {/* -------- FIRST PAGE UI -------- */}
      {currentView === 'main' && (
        <div className='first'>
          <div className='up'>
            <img src='logo2.png' alt='logo' style={{ width: '3%', zIndex: '10000' }} className='ab' />

            <div className='split'>
              <select className='opt'>
                <option>English (Default)</option>
                <option>Chinese</option>
                <option>French</option>
              </select>

              <button className='btna' onClick={handleAboutClick}>About App</button>
            </div>
          </div>

          {/* LEFT SECTION */}
          <div className='left'>
            <div className='left1'>
              <h1 className="now">
                Precision <br />Diagnostics &nbsp;
                <span className="typewriter-wrapper">
                  {displayedText}
                  <span className="cursor"></span>
                </span>
              </h1>

              <p style={{ fontSize: "20px", textAlign: "justify", fontFamily: "Lucida Sans Regular", marginLeft: "-1%", marginTop: "1%" }}>
                ParaVision offers cutting-edge tools for accurate and efficient cellular analysis,
                empowering you to make confident decisions.
              </p>
            </div>

            <div>
              <img src='test.png' alt='paravision logo' className='test' />
            </div>
          </div>

          {/* CORE FUNCTIONALITIES */}
          <div className='third'>
            <h2>Core Functionalities</h2>
          </div>

          <div className="horizontal-layout">
            <div className="item" onClick={handlePatientClick}>
              <svg width="49" height="45" viewBox="0 0 24 24" fill="none" stroke="#143d3eff" strokeWidth="2">
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M5 21v-2a4 4 0 0 1 8 0v2"></path>
                <line x1="16" y1="10" x2="22" y2="10"></line>
                <line x1="16" y1="14" x2="22" y2="14"></line>
                <line x1="16" y1="18" x2="22" y2="18"></line>
              </svg>
              <h5>Patients Record</h5>
              <p>Easily view and add patients records</p>
              <button className='btn1'>Manage Patients</button>
            </div>

            <div className="item" onClick={handleDataClick}>
              <h5>
                <svg width="53" height="45" viewBox="0 0 24 24" fill="none" stroke="#143d3eff" strokeWidth="2">
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
                <svg width="45" height="45" viewBox="0 0 24 24" fill="none" stroke="#143d3eff" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09A1.65 1.65 0 0 0 19.4 15z"></path>
                </svg>
                <br />Configurations
              </h5>
              <p>Manage application settings and preferences</p>
              <button className='btn1'>Configure</button>
            </div>
          </div>
        </div>
      )}

      {/* -------- MODALS -------- */}
      {showAbout && (
        <div className="about-overlay">
          <About onClose={handleCloseAbout} />
        </div>
      )}

      {showRunTest && (
        <div className="run-test-overlay-wrapper">
          <RunTest
            patient={{ id: 'P001', name: 'Demo Patient' }}
            onClose={handleCloseRunTest}
            onTestSelected={(testData, testType) => {
              console.log("Test selected in RunTest:", testData, testType);
              setActiveTest(testData);
              if (testType === 'Blood') {
                setCurrentView('malaria');
              } else if (testType === 'Stool') {
                setCurrentView('stool');
              } else if (testType === 'Stool and Blood') {
                setCurrentView('both');
              }
              setShowRunTest(false);
            }}
          />
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
          <Config onClose={handleCloseHistory} />
        </div>
      )}

      {/* -------- TEST COMPONENTS -------- */}
      {currentView === 'malaria' && activeTest && (
        <MalariaTest
          testData={activeTest}
          onClose={handleMalariaTestClose}
          onComplete={handleMalariaTestComplete}
        />
      )}
    </>
  );
}

export default SplashPage;