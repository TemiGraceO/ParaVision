import React, { useState } from 'react';
import './history.css';

const History = ({ onClose }) => {
  const [closing, setClosing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  const tests = [
    // Example data. Replace with API.
    { id: 1, patientId: 'P001', type: 'Blood', smear: 'Thick Smear', date: '2024-10-01', status: 'Processed' },
    { id: 2, patientId: 'P002', type: 'Stool', smear: 'Direct Smear', date: '2024-10-02', status: 'Pending' },
  ];

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => onClose(), 300);
  };

  const filteredTests = tests.filter(t => 
    (filterType === 'All' || t.type === filterType) &&
    t.patientId.includes(search)
  );

  return (
    <div className={`history-modal-overlay ${closing ? 'hm-slide-out' : ''}`}>
      <div className="history-modal-content">
        <button onClick={handleClose} className="hm-close-btn">×</button>
        <h3 className="hm-title">Review History</h3>
        <hr /><br/>
        <p className="hm-subtitle">Chronological log of activities & changes.</p>
        
        <div className="hm-filters">
          <input
            placeholder=" Search Patient ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="hm-search-input"
          />
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="hm-filter-select">
            <option>All</option>
            <option>Blood</option>
            <option>Stool</option>
            <option>Blood + Stool</option>
          </select>
          <button className="hm-filter-btn">Filter</button>
        </div>

        <table className="hm-table">
          <thead>
            <tr>
              <th>S/N</th>
              <th>Date</th>
              <th>Patient ID</th>
              <th>Test Type</th>
              <th>Smear Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTests.length ? (
              filteredTests.map((t, i) => (
                <tr key={t.id}>
                  <td>{i + 1}</td>
                  <td>{t.date}</td>
                  <td>{t.patientId}</td>
                  <td>{t.type}</td>
                  <td>{t.smear}</td>
                  
                  <td>
                    <button className="hm-action-btn"> View</button>
                    <button className="hm-action-btn"> Print</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="7">No tests found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default History;