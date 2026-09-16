import React, { useState, useEffect } from "react";
import RunTestPage from "./run";
import ViewTestResult from "./ViewTestResult";
import "./view-patient.css";

const ViewPatient = ({ patient, onClose }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tests, setTests] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);
  const [showTestResult, setShowTestResult] = useState(false);
  const [viewingTest, setViewingTest] = useState(null);
  const [localPatient, setLocalPatient] = useState(patient);

  useEffect(() => {
    setLocalPatient(patient);
  }, [patient]);

  const fetchTests = async () => {
    try {
      const res = await fetch(
        `http://localhost:8000/api/tests?patientId=${patient.id}`
      );
      const data = await res.json();
      setTests(data);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching tests:", err);
    }
  };

  useEffect(() => {
    if (!patient?.id) return;
    fetchTests();
  }, [patient.id]);

  const handleTestComplete = (newTest) => {
    if (!newTest) return;
    const normalized = {
      id: newTest.id || newTest._id || `${Date.now()}`,
      patientId: newTest.patientId,
      type: newTest.type || newTest.testType,
      smear: newTest.smear,
      date: newTest.date || new Date().toISOString(),
      result: newTest.result || "Pending...",
    };
    setTests((prev) => [normalized, ...prev]);
    setIsEditing(false);
  };
  
  
  const handlePrintTest = async (test) => {
  if (!test || !test.result) {
    alert('No result available to print.');
    return;
  }

  // Generate analysis (same logic as ViewTestResult)
  const type = (test.type || '').toLowerCase();
  const isBloodTest = type.includes('blood') || type.includes('malaria');
  const isStoolTest = type.includes('stool');

  let malariaStatus = '-';
  let parasiteDensity = '-';
  let stool = { Ascaris: '-', Hookworm: '-', Trichuris: '-' };

  if (isBloodTest) {
    malariaStatus = test.result.status || 'Pending';
    if (test.result.count_per_ul !== undefined) {
      parasiteDensity = `${test.result.count_per_ul} /µL`;
    }
  }

  if (isStoolTest) {
    const ovaPresent = test.result.ova_present || false;
    const ovaTypes = test.result.ova_types || [];
    stool.Ascaris = ovaTypes.includes('Ascaris') ? 'Present' : 'Absent';
    stool.Hookworm = ovaTypes.includes('Hookworm') ? 'Present' : 'Absent';
    stool.Trichuris = ovaTypes.includes('Trichuris') ? 'Present' : 'Absent';
    if (!ovaPresent) {
      stool.Ascaris = stool.Hookworm = stool.Trichuris = 'Absent';
    }
  }

  const analysis = {
    malaria_status: malariaStatus,
    parasite_density: parasiteDensity,
    stool,
    isPending: false
  };

  // Send print request
  try {
    await fetch('http://localhost:8000/api/print-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patient, test, analysis })
    });
    alert('Print job sent successfully!');
  } catch (err) {
    console.error('Print failed:', err);
    alert('Failed to send print job.');
  }
};
  const filteredTests = tests.filter((t) => {
    try {
      return (
        t.patientId
          ?.toLowerCase()
          .includes(search.toLowerCase()) ||
        (t.date &&
          t.date.toLowerCase().includes(search.toLowerCase()))
      );
    } catch {
      return false;
    }
  });

  const handleViewTestResult = (test) => {
    setViewingTest(test);
    setShowTestResult(true);
  };

  const handleCloseTestResult = () => {
    setShowTestResult(false);
    setViewingTest(null);
  };

  return (
    <div className="patient-modal-overlay">
      <div className="patient-card">
        <div className="top-bar">
          <div className="head-id">Patient ID: {patient.id}</div>
          <button className="close-x" onClick={onClose}>
            x
          </button>
        </div>

        <hr />

        {isEditing ? (
          <RunTestPage
            patient={patient}
            onClose={() => setIsEditing(false)}
            onSave={async (updatedPatient) => {
              setLocalPatient(updatedPatient);

              patient.name = updatedPatient.name;
              patient.age = updatedPatient.age;
              patient.gender = updatedPatient.gender;
              patient.id = updatedPatient.id;

              await fetch(
                `http://localhost:8000/api/patients/${updatedPatient.id}`,
                {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(updatedPatient),
                }
              );

              setIsEditing(false);
            }}
          />
        ) : (
          <>
            <div className="details-grid">
              <div>
                <p className="key">Name:</p>
                <p className="value">{localPatient.name}</p>
              </div>
              <div>
                <p className="key">DOB:</p>
                <p className="value">
                  {localPatient.dob
                    ? new Date(localPatient.dob).toLocaleDateString()
                    : "-"}
                </p>
              </div>
              <div>
                <p className="key">Gender:</p>
                <p className="value">{localPatient.gender}</p>
              </div>
              <div>
                <p className="key">Date of Entry:</p>
                <p className="value">
                  {patient.date
                    ? new Date(patient.date).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
              <button
                className="edit"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </button>
            </div>

            <br />

            <h4 className="test-title">Test History</h4>

            <input
              placeholder="Search by Date or Test Type"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="hm"
            />

            {error && <p className="error">{error}</p>}

            <div className="table-container">
              <table className="hm-table">
                <thead>
                  <tr>
                    <th>S/N</th>
                    <th>Date</th>
                    <th>Test Type</th>
                    <th>Smear Type</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTests.length ? (
                    filteredTests.map((t, i) => (
                      <tr key={t.id || i}>
                        <td>{i + 1}</td>
                        <td>
                          {t.date
                            ? new Date(t.date).toLocaleString()
                            : "N/A"}
                        </td>
                        <td>{t.type}</td>
                        <td>{t.smear}</td>
                        <td>
                          <button
                            className="hm-action-btn"
                            onClick={() =>
                              handleViewTestResult(t)
                            }
                          >
                            View
                          </button>
                          <button 
  className="hm-action-btn" 
  onClick={() => handlePrintTest(t)}
>
  Print
</button>                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5">No tests found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {showTestResult && viewingTest && (
        <ViewTestResult
          test={viewingTest}
          patient={patient}
          onClose={handleCloseTestResult}
        />
      )}
    </div>
  );
};

export default ViewPatient;
