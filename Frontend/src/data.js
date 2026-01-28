import React, { useState, useEffect, useRef } from 'react';
import './data.css';
import ImageGalleryModal from './ImageGalleryModal';

import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Data = ({ onClose }) => {
  const [closing, setClosing] = useState(false);
  const [timeRange, setTimeRange] = useState('7d');
  const [testType, setTestType] = useState('all');
  const [gender, setGender] = useState('all');
  const [showImages, setShowImages] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDrivePicker, setShowDrivePicker] = useState(false);
  const [availableDrives, setAvailableDrives] = useState([]);
  const [selectedDrive, setSelectedDrive] = useState(null);

  const [tests, setTests] = useState([]);
  const [patients, setPatients] = useState([]);
  const [stats, setStats] = useState({
    totalTests: 0,
    positiveTests: 0,
    negativeTests: 0,
    positiveRate: 0,
    newPatients: 0,
    testsTrend: 0,
    rateTrend: 0,
    patientsTrend: 0
  });
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: []
  });

  const chartRef = useRef(null);

  // Export handlers
  const handleExportClick = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/drives');
      const data = await res.json();
      setAvailableDrives(data.drives || []);
      setShowDrivePicker(true);
    } catch (e) {
      console.error('Failed to list drives:', e);
      await handleExportInternal();
    }
  };

  const handleExportInternal = async () => {
    const payload = { timeRange, testType, gender, stats };
    try {
      const res = await fetch('http://localhost:8000/api/export-analysis-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to export CSV');
      }

      const data = await res.json();
      console.log('CSV saved at:', data.path);
      alert('CSV exported to internal storage.');
    } catch (e) {
      console.error('Export CSV error:', e);
      alert(`Failed to export CSV: ${e.message}`);
    }
  };

  const handleExportToDrive = async () => {
    if (!selectedDrive) {
      alert('Please select a drive');
      return;
    }

    try {
      const payload = {
        timeRange,
        testType,
        gender,
        stats,
        targetDrive: selectedDrive.mountpoint
      };

      const res = await fetch('http://localhost:8000/api/export-analysis-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to export to drive');
      }

      const data = await res.json();
      setShowDrivePicker(false);
      alert(`CSV exported to ${selectedDrive.mountpoint}`);
    } catch (e) {
      console.error('Export to drive error:', e);
      alert(`Failed to export: ${e.message}`);
    }
  };

  // Fetch data when filters change
  useEffect(() => {
    fetchData();
  }, [timeRange, testType, gender]);

  // Resize chart when data changes
  useEffect(() => {
    if (chartRef.current?.resize) {
      setTimeout(() => chartRef.current.resize(), 100);
    }
  }, [chartData]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [testsRes, patientsRes] = await Promise.all([
        fetch('http://localhost:8000/api/tests'),
        fetch('http://localhost:8000/api/patients')
      ]);

      const testsData = await testsRes.json();
      const patientsData = await patientsRes.json();

      setTests(testsData);
      setPatients(patientsData);
      processData(testsData, patientsData);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const processData = (testsData, patientsData) => {
    const now = new Date();
    let startDate = new Date(now);
    let previousStartDate = new Date(now);
    let previousEndDate = new Date(now);

    // Set date ranges
    switch (timeRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        previousStartDate.setDate(now.getDate() - 14);
        previousEndDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        previousStartDate.setDate(now.getDate() - 60);
        previousEndDate.setDate(now.getDate() - 30);
        break;
      case 'q':
        startDate.setMonth(now.getMonth() - 3);
        previousStartDate.setMonth(now.getMonth() - 6);
        previousEndDate.setMonth(now.getMonth() - 3);
        break;
      case '6m':
        startDate.setMonth(now.getMonth() - 6);
        previousStartDate.setMonth(now.getMonth() - 12);
        previousEndDate.setMonth(now.getMonth() - 6);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    // Filter current period tests
    let filteredTests = testsData.filter(test => {
      const testDate = new Date(test.date);
      return testDate >= startDate && testDate <= now;
    });

    // Filter previous period tests
    let previousTests = testsData.filter(test => {
      const testDate = new Date(test.date);
      return testDate >= previousStartDate && testDate < previousEndDate;
    });

    // Filter by test type
    if (testType !== 'all') {
      const typeFilter = testType === 'blood' ? 'blood' : 'stool';
      filteredTests = filteredTests.filter(test =>
        test.type?.toLowerCase().includes(typeFilter)
      );
      previousTests = previousTests.filter(test =>
        test.type?.toLowerCase().includes(typeFilter)
      );
    }

    // Filter by gender
    if (gender !== 'all') {
      const patientIds = patientsData
        .filter(p => p.gender?.toLowerCase() === gender.toLowerCase())
        .map(p => p.id);
      filteredTests = filteredTests.filter(test => patientIds.includes(test.patientId));
      previousTests = previousTests.filter(test => patientIds.includes(test.patientId));
    }

    // Positive test detection (more flexible)
    const isPositive = test => {
      const result = test.result || {};
      const status = result.status?.toString().toLowerCase() || '';
      return (
        status.includes('positive') ||
        status.includes('ova') ||
        result.ova_present === true ||
        (result.parasites_seen && result.parasites_seen > 0) ||
        result.ova_count > 0
      );
    };

    const totalTests = filteredTests.length;
    const previousTotalTests = previousTests.length;
    const positiveTests = filteredTests.filter(isPositive).length;
    const previousPositiveTests = previousTests.filter(isPositive).length;
    const negativeTests = totalTests - positiveTests;

    const positiveRate = totalTests > 0 ? ((positiveTests / totalTests) * 100).toFixed(1) : 0;
    const previousPositiveRate = previousTotalTests > 0 
      ? ((previousPositiveTests / previousTotalTests) * 100).toFixed(1) 
      : 0;

    // Patient stats
    let filteredPatients = patientsData.filter(patient => {
      const patientDate = new Date(patient.date);
      return patientDate >= startDate && patientDate <= now;
    });
    let previousPatients = patientsData.filter(patient => {
      const patientDate = new Date(patient.date);
      return patientDate >= previousStartDate && patientDate < previousEndDate;
    });

    if (gender !== 'all') {
      filteredPatients = filteredPatients.filter(p => p.gender?.toLowerCase() === gender.toLowerCase());
      previousPatients = previousPatients.filter(p => p.gender?.toLowerCase() === gender.toLowerCase());
    }

    const newPatients = filteredPatients.length;
    const previousNewPatients = previousPatients.length;

    // Trends
    const testsTrend = previousTotalTests > 0
      ? (((totalTests - previousTotalTests) / previousTotalTests) * 100).toFixed(0)
      : totalTests > 0 ? 100 : 0;
    const rateTrend = previousPositiveRate > 0
      ? (parseFloat(positiveRate) - parseFloat(previousPositiveRate)).toFixed(1)
      : positiveRate;
    const patientsTrend = previousNewPatients > 0
      ? (((newPatients - previousNewPatients) / previousNewPatients) * 100).toFixed(0)
      : newPatients > 0 ? 100 : 0;

    setStats({
      totalTests,
      positiveTests,
      negativeTests,
      positiveRate,
      newPatients,
      testsTrend,
      rateTrend,
      patientsTrend
    });

    generateChartData(filteredTests, startDate, now);
  };

  const generateChartData = (filteredTests, startDate, endDate) => {
  let labels = [];
  let dataPoints = [];
  const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

  console.log('filteredTests length:', filteredTests.length); // DEBUG

  const isPositive = test => {
    console.log('test.result:', test.result); // DEBUG - see your actual data
    const result = test.result || {};
    return true; // TEMP: count ALL tests as "positive" to see bars
  };

  if (daysDiff <= 7) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      labels.push(days[date.getDay()]);

      const dayTests = filteredTests.filter(test => {
        const testDate = new Date(test.date);
        return testDate.toDateString() === date.toDateString();
      });
      
      const positiveCount = dayTests.length; // Count ALL tests per day
      dataPoints.push(positiveCount);
      console.log(`${days[date.getDay()]}: ${positiveCount} tests`); // DEBUG
    }
  } else if (daysDiff <= 30) {
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i * 7 + 7));
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - i * 7);
      labels.push(`Week ${4 - i}`);

      const weekTests = filteredTests.filter(test => {
        const testDate = new Date(test.date);
        return testDate >= weekStart && testDate < weekEnd;
      });
      dataPoints.push(weekTests.length);
    }
  } else {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthsToShow = daysDiff <= 90 ? 3 : 6;
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() - i);
      labels.push(months[monthDate.getMonth()]);

      const monthTests = filteredTests.filter(test => {
        const testDate = new Date(test.date);
        return testDate.getMonth() === monthDate.getMonth() && testDate.getFullYear() === monthDate.getFullYear();
      });
      dataPoints.push(monthTests.length);
    }
  }

  const chartData = {
    labels,
    datasets: [{
      label: 'Total Tests', // Changed label
      data: dataPoints,
      backgroundColor: '#4fa5a7',
      borderRadius: 8,
      borderSkipped: false
    }]
  };

  console.log('FINAL chartData:', chartData);
  setChartData(chartData);
};

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => onClose(), 300);
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: t => `${t.raw} positive tests`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false }
      },
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 },
        grid: { color: 'rgba(0,0,0,0.05)' }
      }
    }
  };

  const getTrendDisplay = (trend, isRate = false) => {
    const value = parseFloat(trend) || 0;
    if (value > 0) {
      return {
        arrow: '?',
        color: isRate ? '#dc3545' : '#059f05',
        text: `+${Math.abs(value)}%`
      };
    } else if (value < 0) {
      return {
        arrow: '?',
        color: isRate ? '#059f05' : '#dc3545',
        text: `${value}%`
      };
    }
    return {
      arrow: '?',
      color: '#666',
      text: '0%'
    };
  };

  const testsTrendDisplay = getTrendDisplay(stats.testsTrend);
  const rateTrendDisplay = getTrendDisplay(stats.rateTrend, true);
  const patientsTrendDisplay = getTrendDisplay(stats.patientsTrend);

  const getMostCommonResults = () => {
    const resultCounts = {};
    tests.forEach(test => {
      const result = test.result || {};
      if (result.status) {
        resultCounts[result.status] = (resultCounts[result.status] || 0) + 1;
      }
      if (result.ova_types) {
        result.ova_types.forEach(type => {
          resultCounts[type] = (resultCounts[type] || 0) + 1;
        });
      }
    });

    const sorted = Object.entries(resultCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    if (sorted.length === 0) {
      return <p className="no-data-text">No results yet</p>;
    }

    return sorted.map(([name, count], index) => (
      <div key={index} className="stat-item">
        <span>{name}</span>
        <span className="stat-count">{count}</span>
      </div>
    ));
  };

  return (
    <div className={`data-overlay ${closing ? 'slide-out' : ''}`}>
      <div className="data-container">
        {/* Header */}
        <div className="analytics-header">
          <h2>Data Analytics</h2>
          <div className="header-actions">
            <button className="export-btn" onClick={handleExportClick}>
              Export CSV
            </button>
            <button onClick={handleClose} className="close-btn">×</button>
          </div>
        </div>

        {/* Drive Picker */}
        {showDrivePicker && (
          <div className="drive-picker-overlay">
            <div className="drive-picker">
              <div className="drive-picker-header">
                <h3>Select Drive</h3>
                <button
                  className="close-btn"
                  onClick={() => setShowDrivePicker(false)}
                  style={{ fontSize: '16px' }}
                >
                  ×
                </button>
              </div>
              <div className="drive-list">
                {availableDrives.length === 0 ? (
                  <p>No external drives found. CSV will be saved internally.</p>
                ) : (
                  availableDrives.map((drive, index) => (
                    <div
                      key={index}
                      className={`drive-item ${selectedDrive?.mountpoint === drive.mountpoint ? 'selected' : ''}`}
                      onClick={() => setSelectedDrive(drive)}
                    >
                      <div>
                        <strong>{drive.mountpoint}</strong>
                        <br />
                        <small>{drive.fstype} • {drive.avail} free</small>
                      </div>
                      {selectedDrive?.mountpoint === drive.mountpoint && <span>?</span>}
                    </div>
                  ))
                )}
              </div>
              <div className="drive-buttons">
                <button className="export-btn" onClick={handleExportInternal} style={{ marginRight: '10px' }}>
                  Save Internally
                </button>
                <button className="export-btn" onClick={handleExportToDrive} disabled={!selectedDrive}>
                  Export to Drive
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="filter-bar">
          <select value={testType} onChange={e => setTestType(e.target.value)} className="filter-select">
            <option value="all">All Tests</option>
            <option value="blood">Blood Tests</option>
            <option value="stool">Stool Tests</option>
          </select>
          <select className="filter-select" value={gender} onChange={e => setGender(e.target.value)}>
            <option value="all">All Gender</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>
          <div className="days">
            <p className={timeRange === '7d' ? 'active' : ''} onClick={() => setTimeRange('7d')}>7 Days</p>
            <p className={timeRange === '30d' ? 'active' : ''} onClick={() => setTimeRange('30d')}>30 Days</p>
            <p className={timeRange === 'q' ? 'active' : ''} onClick={() => setTimeRange('q')}>Quarter</p>
            <p className={timeRange === '6m' ? 'active' : ''} onClick={() => setTimeRange('6m')}>6 Months</p>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading analytics...</p>
          </div>
        )}

        {/* Content */}
        {!loading && (
          <>
            {/* Stats Cards */}
            <div className="analytics-grid">
              <div className="card">
                <h1>{stats.totalTests}</h1>
                <p>Total Tests</p>
                <span className="trend" style={{ color: testsTrendDisplay.color }}>
                  {testsTrendDisplay.arrow} {testsTrendDisplay.text}
                </span>
              </div>
              <div className="card">
                <h1>{stats.positiveRate}%</h1>
                <p>Positive Rate</p>
                <span className="trend" style={{ color: rateTrendDisplay.color }}>
                  {rateTrendDisplay.arrow} {rateTrendDisplay.text}
                </span>
              </div>
              <div className="card">
                <h1>{stats.newPatients}</h1>
                <p>New Patients</p>
                <span className="trend" style={{ color: patientsTrendDisplay.color }}>
                  {patientsTrendDisplay.arrow} {patientsTrendDisplay.text}
                </span>
              </div>
            </div>

            {/* Chart + Breakdown */}
            <div className="content-grid">
              <div className="chart-box">
                <h3>Positive Tests Over Time</h3>
                {chartData.labels.length > 0 ? (
                  <div className="chart-container">
                    <Bar ref={chartRef} data={chartData} options={options} />
                  </div>
                ) : (
                  <div className="no-data">
                    <p>No test data for this period</p>
                  </div>
                )}
              </div>

              <div className="breakdown-box">
                <div className="result">
                  <h3>Result Breakdown</h3>
                  <hr />
                  <div className="breakdown-item positive">
                    <span className="dot positive-dot"></span>
                    <p>Positive: {stats.positiveTests} ({stats.positiveRate}%)</p>
                  </div>
                  <div className="breakdown-item negative">
                    <span className="dot negative-dot"></span>
                    <p>Negative: {stats.negativeTests} (
                      {stats.totalTests > 0 ? (100 - Number(stats.positiveRate)).toFixed(1) : 0}%
                    )</p>
                  </div>

                  <div className="type-breakdown">
                    <h4>By Test Type</h4>
                    <p>• Blood: {tests.filter(t => t.type?.toLowerCase().includes('blood')).length}</p>
                    <p>• Stool: {tests.filter(t => t.type?.toLowerCase().includes('stool')).length}</p>
                  </div>

                  <div className="extra-section">
                    <h4>Common Results</h4>
                    {getMostCommonResults()}
                  </div>
                </div>

                <div className="images">
                  <h3>See All Images</h3>
                  <svg
                    width="180"
                    height="140"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="pic"
                    onClick={() => setShowImages(true)}
                  >
                    <path
                      d="M3 5H10L12 7H21C21.55 7 22 7.45 22 8V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 5.45 2.45 5 3 5Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M8 13L10 11L13 14L15 12L18 15"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="9" cy="10" r="1" fill="currentColor" />
                  </svg>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {showImages && <ImageGalleryModal onClose={() => setShowImages(false)} />}
    </div>
  );
};

export default Data;
