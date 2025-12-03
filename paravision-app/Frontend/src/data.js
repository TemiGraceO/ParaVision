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
        borderRadius: 10,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: t => `${t.dataset.label}: ${t.raw} tests` } }
    },
    scales: { y: { beginAtZero: true } }
  };

  return (
    <div className={`data-overlay ${closing ? 'slide-out' : ''}`}>
      <div className="data-container">

        {/* Header */}
        <div className="analytics-header">
          <h2>Data Analytics</h2>
          <button onClick={handleClose} className="close-btn">×</button>
        </div>

        {/* Filters */}
        <div className="filter-bar">

          <select 
            value={testType} 
            onChange={(e) => setTestType(e.target.value)} 
            className="filter-select"
          >
            <option>Blood Tests</option>
            <option>Stool Tests</option>
          </select>

          <select className="filter-select">
            <option>All Gender</option>
            <option>Female</option>
            <option>Male</option>
          </select>

          <div className="days">
            <p className={timeRange === '7d' ? 'active' : ''} onClick={() => setTimeRange('7d')}>7 Days</p>
            <p className={timeRange === '30d' ? 'active' : ''} onClick={() => setTimeRange('30d')}>30 Days</p>
            <p className={timeRange === 'q' ? 'active' : ''} onClick={() => setTimeRange('q')}>Quarter</p>
            <p className={timeRange === '6m' ? 'active' : ''} onClick={() => setTimeRange('6m')}>6 Months</p>
          </div>

        </div>

        {/* Cards */}
        <div className="analytics-grid">
          <div className="card">
            <h1>0</h1>
            <p>Total Tests</p>
            <span className="trend up">+0%</span>
          </div>
          <div className="card">
            <h1>0%</h1>
            <p>Positive Rate</p>
            <span className="trend up">+0%</span>
          </div>
          <div className="card">
            <h1>0</h1>
            <p>New Patients</p>
            <span className="trend up">+0%</span>
          </div>
        </div>

        {/* Chart + Breakdown */}
        <div className="content-grid">
          
          <div className="chart-box">
            <h3>Positive Tests Over Time</h3>
            <Bar data={chartData} options={options} />
          </div>

          <div className="breakdown-box">
            <h3>Result Breakdown</h3>
            <hr />
            <p>🔹 Positive: 0 (0%)</p>
            <p>🔹 Negative: 0 (0%)</p>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Data;
