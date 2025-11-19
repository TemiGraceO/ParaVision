import React, { useEffect } from 'react';
import './first_one.css';

function SplashPage() {
  useEffect(() => {
    const loaderBar = document.querySelector('.loader-bar');
    const logo = document.querySelector('.logo');
    const splashPage = document.querySelector('.splash-page');
    const nextInterface = document.querySelector('.next-interface');

    loaderBar.style.width = '0%';

    let progress = 0;
    const intervalId = setInterval(() => {
      progress += 10;
      loaderBar.style.width = `${progress}%`;
      if (progress >= 100) {
        clearInterval(intervalId);
        logo.classList.add('animate-up');
        splashPage.classList.add('animate-out');
        nextInterface.classList.add('animate-in');
      }
    }, 500);
  }, []);

  return (
    <div className='splash-page main'>
      <div className="words">
        <h1 className='move'>
          <div className="logo">
            <img src='logo2.png' style={{ width: '40%'}}/>
          </div>
          <span id="main">ParaVision</span>
          <br />
          <span className="down">Empowering Precision Diagnostics</span>
        </h1>
        <br></br>
        <div className="loader-container">
          <div className="loader-bar"></div>
        </div>
      </div>
      <div>
        <div className='particles'>
          <img src='red.png' className='particle1'style={{ width: '10%'}} />
        </div>
        <img src="microscope.png" alt="Microscope" style={{ width: '150%', filter: 'drop-shadow(8px 1px rgba(2,8,26,0.3))', }} />
        <div className="a"><h5>TeamABU 2025/2026</h5></div>
      </div>
      <div className="next-interface">
      </div>
    </div>
  );
}

export default SplashPage;