import React, { useEffect } from 'react';
import './first_one.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoon } from '@fortawesome/free-solid-svg-icons';

function SplashPage() {
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
        }, 500); // wait for 0.5s before fading in .first
      }
    }, 500);
  }, []);

  return (
    <>
      <div className='splash-page main'>
        <div className="words">
          <h1 className='move'>
            <div className="logo">
              <img src='logo2.png' alt='paravision logo' style={{ width: '15%'}}/>
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
            <img src='red.png' alt='a single red blood cell' className='particle1'style={{ width: '10%'}} />
          </div>
          <img src="microscope.png" alt="Microscope" style={{ width: '150%', filter: 'drop-shadow(8px 1px rgba(2,8,26,0.3))', }} />
          <div className="a"><h5>TeamABU 2025/2026</h5></div>
        </div>
        <div className="next-interface"> </div>
      </div>
      <div className='first'>
        <div className='up'>
          <img src='logo2.png' alt='logo' style={{ width: '3%',marginLeft:'3%'}} />
          <div><FontAwesomeIcon icon={faMoon}/></div>
                  </div><hr/>
                  <div className='mid'>
                    <div className='left'>
                      <h1>Precision Diagnostics,Redefined</h1>
                      <p>
                        ParaVision offers cutting-edge tools for accurate and <br/>
                        effiecient cellular analysis, empowering you to make<br/> a confident decison
                      </p>
                      <button className='btn'>Start New Diagnostics</button>
                    </div>
                  </div>
                  <div className='third'>
                      <h2>Core Functionalities</h2>
                      <p>Streamline your Diagnostic workflow with our powerful and intuitive features</p>
                    </div>
                    <div class="horizontal-layout">
  <div class="item">
    <h5>Run Diagnostics</h5><p>Initialize new tests with precision and speed</p>
  </div>
  <div class="item"><h5>Patients Management</h5><p>Easily view, add and merge patients records</p></div>
  <div class="item"><h5>Review History</h5><p>Access past test results of patients</p></div>
  <div class="item"><h5>Data Analytics</h5><p>Visualize trends and gain statistical insights</p></div>
</div>
<div className='footer'>TeamABU2025/2026</div>

      </div>
    </>
  );
}

export default SplashPage;