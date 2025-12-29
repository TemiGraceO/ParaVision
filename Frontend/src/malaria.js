import React, { useState, useEffect } from 'react';
import './malaria.css';
import LiveCapture from './LiveCapture'; // Live capture component

const MalariaTest = ({ testData, onClose, onComplete }) => {
  const [analysisStatus, setAnalysisStatus] = useState('analyzing');
  const [results, setResults] = useState(null);
  const [parasitesCount, setParasitesCount] = useState(0);
  const [confidence, setConfidence] = useState(0);
  const [showLiveCapture, setShowLiveCapture] = useState(false); // Controls live capture modal

  // AUTO-START ANALYSIS - 2 MINUTES
  useEffect(() => {
    const timer = setTimeout(() => {
      const mockResults = {
        parasites: Math.floor(Math.random() * 10) + 1,
        confidence: (Math.random() * 0.3 + 0.7).toFixed(2),
        species: ['P. falciparum', 'P. vivax'][Math.floor(Math.random() * 2)],
        severity: 'Low'
      };
      
      setResults(mockResults);
      setParasitesCount(mockResults.parasites);
      setConfidence(mockResults.confidence);
      setAnalysisStatus('complete');
    }, 120000);

    return () => clearTimeout(timer);
  }, []);

  const handleViewResults = () => {
    console.log('Viewing results for:', testData);
    // TODO: Open results view
  };

  const handlePrintResults = () => {
    console.log('Printing results for:', testData);
    window.print(); // Opens print dialog
  };

  const handleLiveCapture = () => {
    setShowLiveCapture(true); // Opens live capture with Orange Pi camera
  };

  return (
    <div className="malaria-overlay">
      <div className="malaria-modal">
        <header className="malaria-header">
          <h2>Malaria Analysis</h2>
          <button onClick={onClose}>×</button>
        </header>

        <div className="malaria-content">
          <div className="patient-info">
            <h3>Patient: {testData.name}</h3>
            <p>ID: {testData.patientId} | Smear: {testData.smear}</p>
          </div>

          <div className="analysis-section">
            {/* ANALYZING SCREEN */}
            {analysisStatus === 'analyzing' && (
              <div className="analyzing-screen">
                <div className="spinner"></div>
                <p>Scanning blood sample</p>
                
                <div className="progress-container">
                  <div className="progress-bar">
                    <div className="progress-fill"></div>
                  </div>
                  <div className="progress-text">Analysis Progress</div>
                </div>
                
                <div className="modal-footer">
                  <button className="live-capture-btn" onClick={handleLiveCapture}>
                    View Live Capture
                  </button>
                </div>
              </div>
            )}

            {/* TEST COMPLETE SCREEN - SHOWS PARASITES & SEVERITY */}
            {analysisStatus === 'complete' && results && (
              <div className="results-screen">
                {/* "TEST COMPLETE" HEADER */}
                <div style={{textAlign: 'center', marginBottom: '40px'}}>
                  <h1 style={{ 
                    color: '#4fa5a7', 
                    fontSize: '48px', 
                    fontWeight: '800',
                    margin: '0',
                    textShadow: '0 4px 12px rgba(79,165,167,0.3)'
                  }}>
                    ? Test Complete
                  </h1>
                </div>

                {/* KEEP ONLY PARASITES & SEVERITY */}
                <div className="results-grid">
                  <div className="result-card positive">
                    <h4>{parasitesCount}</h4>
                    <p>Parasites/µL</p>
                  </div>
                  <div className="result-card">
                    <h4>{results.severity}</h4>
                    <p>Severity</p>
                  </div>
                </div>
                
                {/* VIEW & PRINT BUTTONS */}
                <div className="actions">
                  <button className="view-btn" onClick={handleViewResults}>
                    View Results
                  </button>
                  <button className="print-btn" onClick={handlePrintResults}>
                    Print Results
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* LIVE CAPTURE OVERLAY - FULLY FUNCTIONAL */}
        {showLiveCapture && (
          <LiveCapture 
            onClose={() => setShowLiveCapture(false)}  // Closes live capture
            patientData={testData}                     // Passes patient info
          />
        )}
      </div>
    </div>
  );
};

export default MalariaTest;
