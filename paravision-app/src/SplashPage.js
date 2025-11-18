import React from 'react';
import './first_one.css';

function SplashPage() {
  console.log('SplashPage rendered!')
  return (
    <div className='main'>
      <div className="words">
        <h1 className='move'>
          <span id="main">ParaVision</span>
          <br />
          <span className="down">Empowering Precision Diagnostics</span>
        </h1><br></br>
        <div className="loader-container">
          <div className="loader-bar"></div>
        </div>
      </div>
      <div>
        <img
          src="microscope.png"
          alt="Microscope"
          style={{
            width: '150%',
            filter: 'drop-shadow(8px 1px rgba(2,8,26,0.3))',
          }}
        />
      </div>
    </div>
  );
}

export default SplashPage;