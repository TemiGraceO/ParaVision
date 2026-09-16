import React, { useEffect, useRef, useState } from "react";
import LiveCaptureStool from "./LiveCaptureStool";
import "./stool.css";
import { restoreLEDs } from "./restoreLEDs";
import ViewTestResult from "./ViewTestResult";

const TEST_DURATION = 60;

export default function Stool({ patient, onClose }) {
  const [showResults, setShowResults] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TEST_DURATION);
  const [viewingTest, setViewingTest] = useState(null);
  const [testId, setTestId] = useState(null);
  const [parasitePresence, setParasitePresence] = useState({
    Hookworm: "Absent",
    Ascaris: "Absent",
    Trichuris: "Absent",
  });
  const [testComplete, setTestComplete] = useState(false);
  const [showLive, setShowLive] = useState(false);

  const detectionIntervalRef = useRef(null);
  const timerRef = useRef(null);
  const runningDetectionRef = useRef(false);

  /* ================= CLEANUP ================= */
  useEffect(() => {
    const handleUnload = () => restoreLEDs();
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      restoreLEDs();
    };
  }, []);

  /* ================= DETECTION ================= */
  useEffect(() => {
    if (testComplete) return;

    detectionIntervalRef.current = setInterval(async () => {
      if (runningDetectionRef.current) return;
      runningDetectionRef.current = true;

      try {
        const frame = await window.electronAPI.captureStoolFrame();
        if (!frame?.success) return;

        const result = await window.electronAPI.detectFrameStool(frame.dataUrl);
        if (result?.success && result.boxes) {
          const updated = {
            Hookworm: "Absent",
            Ascaris: "Absent",
            Trichuris: "Absent",
          };

          result.boxes.forEach((box) => {
            if (updated[box.class_name] !== undefined) {
              updated[box.class_name] = "Present";
            }
          });

          setParasitePresence(updated);
        }
      } catch (err) {
        console.error("Stool detection error:", err);
      } finally {
        runningDetectionRef.current = false;
      }
    }, 1000);

    return () => clearInterval(detectionIntervalRef.current);
  }, [testComplete]);

  /* ================= TIMER ================= */
  useEffect(() => {
    if (testComplete) return;

    if (timeLeft <= 0) {
      clearInterval(detectionIntervalRef.current);
      clearTimeout(timerRef.current);
      setTestComplete(true);
      setShowLive(false);
      autoSave();
      return;
    }

    timerRef.current = setTimeout(() => setTimeLeft((t) => t - 1), 1000);

    return () => clearTimeout(timerRef.current);
  }, [timeLeft, testComplete]);

  /* ================= HELPERS ================= */
  const buildStoolResult = () => {
    const ovaTypes = Object.entries(parasitePresence)
      .filter(([, v]) => v === "Present")
      .map(([k]) => k);

    return {
      ova_present: ovaTypes.length > 0,
      ova_types: ovaTypes,
    };
  };

  const buildStoolAnalysis = (result) => {
    const stool = {
      Ascaris: "Absent",
      Hookworm: "Absent",
      Trichuris: "Absent",
    };

    result.ova_types.forEach((t) => {
      stool[t] = "Present";
    });

    return {
      malaria_status: "-",
      parasite_density: "-",
      stool,
      isPending: false,
    };
  };

  /* ================= PRINT HELPER ================= */
  const buildTestObject = () => {
  const result = buildStoolResult();
  const analysis = buildStoolAnalysis(result);
  const ParasiteSummary = () => (
  <div className="parasite-summary">
    {["Ascaris", "Hookworm", "Trichuris"].map((p) => (
      <div className="parasite-row" key={p}>
        <span className="parasite-name">{p}</span>
        <span
          className={`parasite-status ${
            parasitePresence[p] === "Present" ? "present" : "absent"
          }`}
        >
          {parasitePresence[p]}
        </span>
      </div>
    ))}
  </div>
);


  return {
    patientId: patient.id,
    name: patient.name,        // use actual patient name
    dob: patient.dob,          // add DOB
    gender: patient.gender,    // add gender
    type: patient.lastTest?.type || "Stool",    // use saved type if available
    smear: patient.lastTest?.smear || "N/A",   // use saved smear
    result,
    analysis,
    date: new Date().toISOString(),
  };
};


  /* ================= PRINT ================= */
  const handlePrintTest = async () => {
  if (!testId) {
    alert("Test not saved yet. Please wait.");
    return;
  }

  try {
    await fetch("http://localhost:8000/api/print-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        test_id: testId
      }),
    });

    alert("Print job sent successfully!");
  } catch (err) {
    console.error("Print failed:", err);
    alert("Failed to print result.");
  }
};




  /* ================= AUTO SAVE ================= */
  const autoSave = async () => {
  try {
    const result = buildStoolResult();
    const analysis = buildStoolAnalysis(result);

    const test = {
      patientId: patient.id,
      name: "Stool Test",
      type: "Stool",
      smear: "N/A",
      result,
      analysis,
      date: new Date().toISOString(),
    };

    const saved = await window.electronAPI.saveTest(test);

    if (saved?.id) {
      setTestId(saved.id); // ? THIS WAS MISSING
    }
  } catch (err) {
    console.error("Auto-save failed:", err);
  }
};


  /* ================= UI ================= */
  const totalPresence = Object.values(parasitePresence).includes("Present")
    ? "Present"
    : "Absent";
  return (
    <div className="malaria-overlay">
      <div className="malaria-card">
        <header className="malaria-header">
          <h2>Stool Test</h2>
          <button className="close-btn" onClick={onClose}>
            x
          </button>
        </header>

        <div className="malaria-body">

  {/* ================= RUNNING ================= */}
  {!testComplete && (
    <>
      <div className="malaria-spinner"></div>

      <div className="malaria-info">
        <div className="info-item">
          <label>Time Remaining</label>
          <span>{timeLeft}s</span>
        </div>
        <div className="info-item">
          <label>Parasites Detected</label>
          <span>{totalPresence}</span>
        </div>
      </div>

      <button
        className="malaria-btn primary"
        onClick={() => setShowLive(true)}
      >
        View Live Capture
      </button>
    </>
  )}

  {/* ================= COMPLETED (NO RESULTS) ================= */}
  {testComplete && !showResults && (
    <>
      <div className="malaria-checkmark">
        <svg viewBox="0 0 52 52">
          <circle cx="26" cy="26" r="25" fill="none" stroke="#4CAF50" strokeWidth="2" />
          <path fill="none" stroke="#4CAF50" strokeWidth="4" d="M14 27l7 7 16-16" />
        </svg>
      </div>

      <h3 className="result-title">Test Completed</h3>

      <div className="button-group">
        <button
  className="malaria-btn secondary"
  onClick={() => setViewingTest(buildTestObject())} // Build and show modal
>
  View Result Details
</button>


        <button
          className="malaria-btn secondary print"
          onClick={handlePrintTest}
        >
          Print Result
        </button>
      </div>
    </>
  )}

  

{viewingTest && (
  <ViewTestResult
    patient={patient}
    test={viewingTest}
    onClose={() => setViewingTest(null)}
  />
)}
</div>
</div>

             
      <LiveCaptureStool
        visible={showLive}
        currentCounts={parasitePresence}
        onClose={() => setShowLive(false)}
        onDetection={setParasitePresence}
      />
    </div>
  );
}
