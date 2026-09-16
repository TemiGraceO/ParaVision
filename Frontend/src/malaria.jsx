import React, { useEffect, useRef, useState } from "react";
import LiveCapture from "./LiveCapture";
import "./malaria.css";
import { restoreLEDs } from "./restoreLEDs";
import ViewTestResult from "./ViewTestResult";

const TEST_DURATION = 60;

export default function Malaria({ patient, onClose }) {
  const [timeLeft, setTimeLeft] = useState(TEST_DURATION);
  const [parasiteCount, setParasiteCount] = useState(0);
  const [testComplete, setTestComplete] = useState(false);
  const [showLive, setShowLive] = useState(false);

  const [testId, setTestId] = useState(null);
  const [showTestResult, setShowTestResult] = useState(false);
  const [viewingTest, setViewingTest] = useState(null);

  const detectionIntervalRef = useRef(null);
  const timerRef = useRef(null);

  /* =============== CLEANUP (LEDs) =============== */
  useEffect(() => {
    const handleUnload = () => restoreLEDs();
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      restoreLEDs();
    };
  }, []);

  /* =============== LIVE DETECTION =============== */
  useEffect(() => {
    if (testComplete) return;

    detectionIntervalRef.current = setInterval(async () => {
      try {
        const frame = await window.electronAPI.captureBloodFrame();
        if (!frame?.success) return;

        const result = await window.electronAPI.detectFrame(frame.dataUrl);
        if (result?.success && Array.isArray(result.boxes)) {
          setParasiteCount(result.boxes.length);
        }
      } catch (err) {
        console.error("Detection error:", err);
      }
    }, 1000);

    return () => clearInterval(detectionIntervalRef.current);
  }, [testComplete]);

  /* =============== RESULT BUILDER =============== */
  const buildTestObject = () => {
    const analysis = {
      malaria_status: parasiteCount > 0 ? "Positive" : "Negative",
      parasite_density: `${parasiteCount} /µL`,
      stool: {
        Ascaris: "-",
        Hookworm: "-",
        Trichuris: "-",
      },
      isPending: false,
    };

    return {
      patientId: patient.id,
      patientName: patient.name,
      type: "Blood",
      smear: "Blood Film",
      date: new Date().toISOString(),
      status: "completed",
      result: {
        status: analysis.malaria_status,
        count_per_ul: parasiteCount,
        success: parasiteCount > 0,
        malaria_status: analysis.malaria_status,
        parasite_density: parasiteCount,
      },
      analysis,
    };
  };

  /* =============== AUTO SAVE =============== */
  const autoSave = async () => {
    if (testId) return testId;

    try {
      const test = buildTestObject();
      const saved = await window.electronAPI.saveTest(test);
      if (saved?.id) {
        setTestId(saved.id);
        return saved.id;
      }
      return null;
    } catch (err) {
      console.error("Auto-save failed:", err);
      return null;
    }
  };

  /* =============== TIMER =============== */
  useEffect(() => {
    if (testComplete) return;

    if (timeLeft <= 0) {
      clearInterval(detectionIntervalRef.current);
      clearTimeout(timerRef.current);

      const finalTest = buildTestObject();

      const saveTestAndComplete = async () => {
        try {
          const saved = await window.electronAPI.saveTest(finalTest);
          if (saved?.id) {
            setTestId(saved.id);
          }
        } catch (err) {
          console.error("Failed to save test:", err);
        }

        setTestComplete(true);
        setShowLive(false);
      };

      saveTestAndComplete();
      return;
    }

    timerRef.current = setTimeout(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearTimeout(timerRef.current);
  }, [timeLeft, testComplete]);

  /* =============== VIEW RESULT FROM BACKEND =============== */
  const handleViewTestResult = async () => {
    if (!testId) {
      alert("Test not yet saved. Complete the test first.");
      return;
    }

    try {
      // Fetch all tests for this patient
      const res = await fetch(
        `http://localhost:8000/api/tests?patientId=${patient.id}`
      );
      const allTests = await res.json();

      // Find the specific test by id
      const thisTest = allTests.find((t) => t.id === testId);
      if (!thisTest) {
        alert("Test not found in backend.");
        return;
      }

      // Ensure required fields exist
      const displayTest = {
        ...thisTest,
        patientId: thisTest.patientId || patient.id,
        patientName: thisTest.patientName || patient.name,
        result:
          thisTest.result ||
          {
            success: parasiteCount > 0,
            malaria_status: parasiteCount > 0 ? "Positive" : "Negative",
            parasite_density: parasiteCount,
          },
        analysis:
          thisTest.analysis ||
          {
            malaria_status: parasiteCount > 0 ? "Positive" : "Negative",
            parasite_density: `${parasiteCount} /µL`,
            stool: { Ascaris: "-", Hookworm: "-", Trichuris: "-" },
          },
      };

      setViewingTest(displayTest);
      setShowTestResult(true);
    } catch (err) {
      console.error("Failed to fetch test:", err);
      alert("Could not fetch test details.");
    }
  };

  /* =============== PRINT =============== */
  const handlePrintTest = async () => {
    if (!testId) {
      alert("Test not saved yet. Please wait.");
      return;
    }

    try {
      await fetch("http://localhost:8000/api/print-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test_id: testId }),
      });

      alert("Print job sent successfully!");
    } catch (err) {
      console.error("Print failed:", err);
      alert("Failed to print result.");
    }
  };

  /* =============== UI =============== */
  return (
    <div className="malaria-overlay">
      <div className="malaria-card">
        {/* Header */}
        <header className="malaria-header">
          <h2>Malaria Diagnostic Test</h2>
          <button className="close-btn" onClick={onClose}>
            x
          </button>
        </header>

        {/* Body */}
        <div className="malaria-body">
          {!testComplete ? (
            <>
              <div className="malaria-spinner"></div>

              <div className="malaria-info">
                <div className="info-item">
                  <label>Time Remaining</label>
                  <span>{timeLeft}s</span>
                </div>
                <div className="info-item">
                  <label>Parasites Detected</label>
                  <span>{parasiteCount}</span>
                </div>
              </div>

              <button
                className="malaria-btn primary"
                onClick={() => setShowLive(true)}
              >
                View Live Capture
              </button>
            </>
          ) : (
            <>
              <div className="malaria-checkmark">
                <svg viewBox="0 0 52 52">
                  <circle
                    cx="26"
                    cy="26"
                    r="25"
                    fill="none"
                    stroke="#4CAF50"
                    strokeWidth="2"
                  />
                  <path
                    fill="none"
                    stroke="#4CAF50"
                    strokeWidth="4"
                    d="M14 27l7 7 16-16"
                  />
                </svg>
              </div>

              <h3 className="result-title">Test Complete</h3>
              <p className="result-count">
                Total Parasites Detected: {parasiteCount}
              </p>

              <div className="button-group">
                <button
                  className="malaria-btn secondary"
                  onClick={handleViewTestResult}
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
        </div>
      </div>

      {/* Live Capture Modal */}
      <LiveCapture
        visible={showLive}
        currentCount={parasiteCount}
        onClose={() => setShowLive(false)}
        onDetection={setParasiteCount}
      />

      {showTestResult && viewingTest && (
        <ViewTestResult
          test={viewingTest}
          patient={patient}
          onClose={() => {
            setShowTestResult(false);
            setViewingTest(null);
          }}
        />
      )}
    </div>
  );
}
