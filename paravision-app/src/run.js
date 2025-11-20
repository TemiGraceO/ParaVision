import React from 'react';
import './run.css';

const RunTest = ({ onClose }) => {
  return (
    <div className="run-test-overlay">
      <div className="run-test-container">
        <header className="run-test-header">
          <h2>Run Test</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </header><hr />
        <main className="run-test-content">
          <form>
           <p className='smear'>Select Smear Type</p>
           <div className='options'>
            <div className='left'>           
              <input type="radio" id="option1" name="option" value="option1"/>
    <label for="option1">Thin</label></div>
            <div className='right'>
    <input type="radio" id="option2" name="option" value="option2"/>
    <label for="option2">Thick</label></div></div><br/>
    <h5>Patient Demographics</h5>
    <p>Name</p>
    <input placeholder='Enter Full name' type='text'/>
    <div className='two'>
      <div>
        <p>Age</p><input placeholder='eg 42'/><br/></div>
        <div><p>Gender</p>
          <select style={{width:'200%'}}>
            <option>Select</option>
            <option>Male</option>
          <option>Female</option>
          <option>Others</option></select>
          </div>
          </div>
          <p>Patient ID</p>
    <input placeholder='Enter Patient ID' type='text'/><hr/>
    <button className='run-btn' type='submit'>Run Test</button>
    </form>
        </main>
      </div>
    </div>
  );
};

export default RunTest;
