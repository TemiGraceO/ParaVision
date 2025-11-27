import React, { useState } from 'react';
import './data.css';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Data = ({ onClose }) => {
  const [closing, setClosing] = useState(false);
  const [timeRange, setTimeRange] = useState('7d');
  const [testType, setTestType] = useState('all');

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => onClose(), 300);
  };

  const chartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Positive Tests',
        data: [12, 19, 3, 5, 2, 3, 7],
        backgroundColor: '#4fa5a7',
        borderRadius: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (t) => `${t.dataset.label}: ${t.raw} tests` } },
    },
    scales: { y: { beginAtZero: true } },
  };

  return (
    <div className={`data-overlay ${closing ? 'slide-out' : ''}`}>
      <div className="data-container">
        <button onClick={handleClose} className="close-btn">×</button>
        <h3 className='data'>Data Analytics</h3><hr /><br />

        <div className="filters">
          <div className='in'>
            <input type="date" defaultValue="2025-12-25" />
            <select value={testType} onChange={(e) => setTestType(e.target.value)}>
              <option>All Tests</option>
              <option>COVID-19</option>
              <option>Malaria</option>
            </select>
            <select>
              <option>All Patient Groups</option>
            </select>
          </div>
          <div className='time'>
            <p className={timeRange === '7d' ? 'active' : ''} onClick={() => setTimeRange('7d')}>Last 7 Days</p>
            <p className={timeRange === '30d' ? 'active' : ''} onClick={() => setTimeRange('30d')}>Last 30 Days</p>
            <p className={timeRange === 'q' ? 'active' : ''} onClick={() => setTimeRange('q')}>This Quarter</p>
            <p className={timeRange === '6m' ? 'active' : ''} onClick={() => setTimeRange('6m')}>Last 6 Months</p>
          </div>
        </div>

        <div className="analytics-grid">
          <div className="card">
            <h2>0</h2>
            <p>Total Tests Processed</p>
            <span className="up">+0%</span>
          </div>
          <div className="card">
            <h2>0%</h2>
            <p>Positive Result Rate</p>
            <span className="up">+0%</span>
          </div>
          <div className="card">
            <h2>0</h2>
            <p>New Patients Analyzed</p>
            <span className="up">+0%</span>
          </div>
        </div>

        <div className="content-grid">
          <div className="chart-box">
            <h3>Positive Tests Over Time</h3>
            <Bar data={chartData} options={options} />
          </div>
          <div className="breakdown-box">
            <h3>Result Breakdown</h3><hr />
            <p>🔹 Positive: 0 (0%)</p>
            <p>🔹 Negative: 0 (0%)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Data;