import React, { useState, useEffect } from "react";
import "./view.css";

const ViewTestResult = ({ test, patient, onClose }) => {
  const [analysis, setAnalysis] = useState({
    malaria_status: "-",
    parasite_density: "-",
    stool: {
      Ascaris: "-",
      Hookworm: "-",
      Trichuris: "-"
    },
    isPending: true
  });

  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState({
    hospitalName: "ParaVision Diagnostics",
    testBy: ""
  });

  /* ================= LOAD HOSPITAL CONFIG ================= */

  useEffect(() => {
    fetch("http://localhost:8000/api/config")
      .then(res => res.json())
      .then(data =>
        setConfig({
          hospitalName: data.hospitalName || "ParaVision Diagnostics",
          testBy: data.testBy || ""
        })
      )
      .catch(() => {});
  }, []);

  /* ================= BUILD ANALYSIS FROM TEST ================= */

  /* ================= BUILD ANALYSIS FROM TEST ================= */

useEffect(() => {
  if (!test) return;

  // ? NEW TESTS (preferred)
  if (test.analysis) {
    setAnalysis(test.analysis);
    setLoading(false);
    return;
  }

  // ?? FALLBACK FOR OLD SAVED TESTS
  const r = test.result || {};

  setAnalysis({
    malaria_status: r.status || "-",
    parasite_density:
      r.count_per_ul !== undefined ? `${r.count_per_ul} /µL` : "-",
    stool: {
      Ascaris: (r.ova_types || []).includes("Ascaris") ? "Present" : "Absent",
      Hookworm: (r.ova_types || []).includes("Hookworm") ? "Present" : "Absent",
      Trichuris: (r.ova_types || []).includes("Trichuris") ? "Present" : "Absent"
    },
    isPending: false
  });

  setLoading(false);
}, [test]);

  /* ================= HELPERS ================= */

  const calculateAge = dob => {
    if (!dob) return "N/A";
    const today = new Date();
    const birth = new Date(dob);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age >= 0 ? `${age} years` : "N/A";
  };

  const formatDate = date => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  /* ================= PRINT ================= */

  const handlePrint = async () => {
  if (!test || !patient) {
    alert("Missing test or patient data");
    return;
  }

  try {
    await fetch("http://localhost:8000/api/print-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patient,
        test,
        analysis
      })
    });

    alert("Print job sent successfully!");
  } catch (err) {
    console.error("Print failed:", err);
    alert("Failed to send print job.");
  }
};


  /* ================= UI ================= */

  if (loading) {
    return (
      <div className="test-result-modal-overlay">
        <div className="test-result-card">
          <p>Loading test result...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="test-result-modal-overlay">
      <div className="test-result-card">
        {/* HEADER */}
        <div className="test1">
          <h2>Test Result</h2>
          <button className="close" onClick={onClose}>x</button>
        </div>

        {/* HOSPITAL */}
        <div className="middle">
          <h3>{config.hospitalName}</h3>
          <h4>Official Laboratory Report</h4>
        </div>

        {/* PATIENT INFO */}
        <table className="my-table">
          <tbody>
            <tr className="section-header">
              <td colSpan="2">Patient Information</td>
            </tr>
            <tr><th>Name:</th><td>{patient.name || "N/A"}</td></tr>
            <tr><th>ID:</th><td>{patient.id || "N/A"}</td></tr>
            <tr><th>DOB:</th><td>{patient.dob || "N/A"}</td></tr>
            <tr><th>Age:</th><td>{calculateAge(patient.dob)}</td></tr>
            <tr><th>Gender:</th><td>{patient.gender || "N/A"}</td></tr>

            <tr className="section-header">
              <td colSpan="2">Test Information</td>
            </tr>
            <tr><th>Test Type:</th><td>{test.type || "N/A"}</td></tr>
            <tr><th>Smear/Method:</th><td>{test.smear || "N/A"}</td></tr>
            <tr><th>Date:</th><td>{formatDate(test.date)}</td></tr>

            <tr className="section-header">
              <td colSpan="2">Results</td>
            </tr>

            {(test.type || "").toLowerCase().includes("blood") && (
              <>
                <tr>
                  <th>Malaria Status:</th>
                  <td>{analysis.malaria_status}</td>
                </tr>
                <tr>
                  <th>Parasite Count:</th>
                  <td>{analysis.parasite_density}</td>
                </tr>
              </>
            )}

            {(test.type || "").toLowerCase().includes("stool") && (
              <>
                <tr><th>Ascaris:</th><td>{analysis.stool.Ascaris}</td></tr>
                <tr><th>Hookworm:</th><td>{analysis.stool.Hookworm}</td></tr>
                <tr><th>Trichuris:</th><td>{analysis.stool.Trichuris}</td></tr>
              </>
            )}
          </tbody>
        </table>

        {/* SIGNATURE */}<br/>
        <div className="signature-section">
          <div className="signature-line">
            <span>Tested By:</span>
            <span className="line">{config.testBy}</span>
          </div>
        </div>

        {/* PRINT */}
        <button className="btn312" onClick={handlePrint}>
          Print Report
        </button>
      </div>
    </div>
  );
};

export default ViewTestResult;
