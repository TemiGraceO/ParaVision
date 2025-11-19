import React from 'react';
import './first_one.css';

function SplashPage() {
  console.log('SplashPage rendered!')
  return (
    <div className='main'>
      <div className="words">
        <h1 className='move'><div>
      <img src='logo2.png' style={{
            width: '40%'}}/></div><span id="main">ParaVision</span>
          <br />
          <span className="down">Empowering Precision Diagnostics</span>
        </h1><br></br>
        <div className="loader-container">
          <div className="loader-bar"></div>
        </div>
       
      </div>
      <div>
         <div className='particles'>
            <img src='red.png' className='particle1'style={{
            width: '10%'}} />
        </div>
        <img
          src="microscope.png"
          alt="Microscope"
          style={{
            width: '150%',
            filter: 'drop-shadow(8px 1px rgba(2,8,26,0.3))',
          }}
        /><div className="a"><h5>TeamABU 2025/2026</h5></div>
      </div>
      </div>
  );
}

export default SplashPage;