import React, { useEffect, useState } from 'react';
import './view.css';

const ViewTestResult = ({ test, patient, onClose }) => {
  const [config, setConfig] = useState({
    hospitalName: "",
    address: "",
    testBy: ""
  });

  // Fetch hospital config
  useEffect(() => {
    fetch("http://localhost:8000/api/config")
      .then(res => res.json())
      .then(data => {
        if (data) {
          setConfig({
            hospitalName: data.hospitalName || "",
            address: data.address || "",
            testBy: data.testBy || ""
          });
        }
      });
  }, []);

  return (
    <div className="test-result-modal-overlay">
      <div className="test-result-card">
        <div className='test1'>
          <h2>Result</h2>
          <button className="close" onClick={onClose}>X</button>
        </div>

        <div>
          <div className='a123'>
            <div className='middle'>
            <h3>{config.hospitalName}</h3>
            <h4>{config.address}</h4>
            </div>
            <div>
            <table className='my-table'>
              <tr>
                <th className='key'>Patient Name:</th>
                <th className='value'>{patient.name}</th>
              </tr>
              <tr>
                <th className='key'>Patient ID:</th>
                <th className='value'>{patient.id}</th>
              </tr>
              <tr>
                <th className='key'>Test Type:</th>
                <th className='value'>{test.type}</th>
              </tr>
              <tr>
                <th className='key'>Date of Test:</th>
                <th className='value'>{new Date(test.date).toLocaleString()}</th>
              </tr>
              <tr>
                <th className='key'>Test Taken By:</th>
                <th className='value'>{config.testBy}</th>
              </tr> 
              <tr>
                <th className='key'>Malaria Status:</th>
                <th></th>
              </tr>
              <tr>
                <th className='key'>RBC:</th>
                <th></th>
              </tr>
              <tr>
                <th className='key'>WBC:</th>
                <th></th>
              </tr>
              <tr>
                <th className='key'>Ascaris:</th>
                <th className='value'></th>
              </tr>
              <tr>
                <th className='key'>Hookworm:</th>
                <th className='value'></th>
              </tr>
              <tr>
                <th className='key'>Trichuris:</th>
                <th className='value'></th>
              </tr>
            </table>
            </div>
          </div>    
          <button className='btn31' onClick={window.print}>Print</button>
        </div>
      </div>
    </div>
  );
};

export default ViewTestResult;
