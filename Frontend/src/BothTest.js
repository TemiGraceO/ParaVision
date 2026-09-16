import React, { useEffect, useRef, useState } from "react";
import EmbeddedBloodCapture from "./EmbeddedBloodCapture";
import EmbeddedStoolCapture from "./EmbeddedStoolCapture";
import "./both-test.css";
import { restoreLEDs } from "./restoreLEDs";
import ViewTestResult from "./ViewTestResult";

const TEST_DURATION = 60;

export default function BothTest({ patient, onClose }) {
  // State
  const [timeLeft, setTimeLeft] = useState(TEST_DURATION);
  const [bloodCount, setBloodCount] = useState(0);
  const [testId, setTestId] = useState(null);
  const [viewingTest, setViewingTest] = useState(null);
  const [stoolPresence, setStoolPresence] = useState({
    Ascaris: "Absent",
    Hookworm: "Absent",
    Trichuris: "Absent",
  });
  const [testComplete, setTestComplete] = useState(false);
  const [showLive, setShowLive] = useState(false);
  const [countingActive, setCountingActive] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);

  // Refs
  const timerRef = useRef(null);

  // Cleanup LEDs on unmount
  useEffect(() => {
    const handleUnload = () => restoreLEDs();
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      restoreLEDs();
    };
  }, []);

  // Timer Effect
  useEffect(() => {
    if (testComplete) return;

    if (timeLeft <= 0) {
      clearTimeout(timerRef.current);
      setTestComplete(true);
      setCountingActive(false);
      setShowLive(false);
      autoSave();
      return;
    }

    timerRef.current = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timerRef.current);
  }, [timeLeft, testComplete]);

  // HELPERS
  const buildBloodResult = () => ({
    status: bloodCount > 0 ? "Positive" : "Negative",
    count_per_ul: bloodCount,
  });

  const buildStoolResult = () => {
    const ovaTypes = Object.entries(stoolPresence)
      .filter(([, value]) => value === "Present")
      .map(([key]) => key);

    return {
      ova_present: ovaTypes.length > 0,
      ova_types: ovaTypes,
    };
  };

  const buildAnalysis = (bloodResult, stoolResult) => ({
    malaria_status: bloodResult.status,
    parasite_density: `${bloodResult.count_per_ul} /µL`,
    stool: {
      Ascaris: stoolPresence.Ascaris,
      Hookworm: stoolPresence.Hookworm,
      Trichuris: stoolPresence.Trichuris,
    },
    isPending: false,
  });

  const buildTestObject = () => {
    const bloodResult = buildBloodResult();
    const stoolResult = buildStoolResult();
    const analysis = buildAnalysis(bloodResult, stoolResult);

    return {
      patientId: patient?.id,
      name: "Blood & Stool Test",
      type: "Blood + Stool",
      smear: "Blood & Stool",
      date: new Date().toISOString(),
      result: {
        ...bloodResult,
        ...stoolResult,
      },
      analysis,
    };
  };

  // AUTO SAVE
  const autoSave = async () => {
  if (!patient) {
    console.error("No patient data to save test!");
    return null;
  }

  try {
    const test = buildTestObject();

    const saved = await window.electronAPI.saveTest(test);
    // saved should be: { id: "uuid" }

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

  // PRINT
  const handlePrintBoth = async () => {
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



  // UI HELPERS
  const totalStoolPresence = Object.values(stoolPresence).includes("Present")
    ? "Present"
    : "Absent";

  const isPrintDisabled = !testId || isPrinting;

  return (
    <>
      {/* MAIN TEST CARD */}
      <div className="malaria-overlay">
        <div className="malaria-card">
          <header className="malaria-header">
            <h2>Blood & Stool Test</h2>
            <button className="close-btn" onClick={onClose}>
              x
            </button>
          </header>

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
                    <label>Malaria Parasites</label>
                    <span>{bloodCount}</span>
                  </div>
                  <div className="info-item">
                    <label>Stool Parasites</label>
                    <span>{totalStoolPresence}</span>
                  </div>
                </div>
                <button
  className="malaria-btn secondary"
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

                <div className="results-grid">
                  <div className="result-box">
                    <h4>Malaria Count</h4>
                    <p className="result-value">{bloodCount}</p>
                  </div>
                  <div className="result-box">
                    <h4>Stool Results</h4>
                    <p>
                      Ascaris:{" "}
                      <span
                        className={
                          stoolPresence.Ascaris === "Present"
                            ? "present"
                            : ""
                        }
                      >
                        {stoolPresence.Ascaris}
                      </span>
                    </p>
                    <p>
                      Hookworm:{" "}
                      <span
                        className={
                          stoolPresence.Hookworm === "Present"
                            ? "present"
                            : ""
                        }
                      >
                        {stoolPresence.Hookworm}
                      </span>
                    </p>
                    <p>
                      Trichuris:{" "}
                      <span
                        className={
                          stoolPresence.Trichuris === "Present"
                            ? "present"
                            : ""
                        }
                      >
                        {stoolPresence.Trichuris}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="button-group">
  <button
    className="malaria-btn secondary"
    onClick={() => setViewingTest(buildTestObject())}
  >
    View Result Details
  </button>
  <button
    className="malaria-btn secondary print"
    onClick={handlePrintBoth}
    disabled={isPrinting}
  >
    {isPrinting ? "Printing..." : "Print Result"}
  </button>
</div>

{/* VIEW TEST MODAL */}
{viewingTest && (
  <ViewTestResult
    patient={patient}
    test={viewingTest}
    onClose={() => setViewingTest(null)}
  />
)}
              </>
            )}
          </div>
        </div>
      </div>

      {/* BACKGROUND CAPTURE */}
      {countingActive && (
        <div style={{ display: "none" }}>
          <EmbeddedBloodCapture
            visible={countingActive}
            onDetection={setBloodCount}
          />
          <EmbeddedStoolCapture
            visible={countingActive}
            onDetection={setStoolPresence}
          />
        </div>
      )}
 
      
      {/* LIVE MODAL */}
      <div className={`both-live-overlay ${showLive ? "show" : ""}`}>
        <div className="both-live-content">
          <header className="both-live-header">
            <h3>Microscopic Live View</h3>
            <button className="close-x" onClick={() => setShowLive(false)}>
              x
            </button>
          </header>

          <div className="both-live-grid">
            <div className="live-cell">
              <h4>Blood Sample</h4>
              <EmbeddedBloodCapture
                visible={countingActive}
                onDetection={setBloodCount}
              />
              <p>Blood Parasite Count: {bloodCount}</p>
            </div>

            <div className="live-cell">
              <h4>Stool Sample</h4>
              <EmbeddedStoolCapture
                visible={countingActive}
                onDetection={setStoolPresence}
              />
              <div className="stool-counts">
                <p>Ascaris: {stoolPresence.Ascaris}</p>
                <p>Hookworm: {stoolPresence.Hookworm}</p>
                <p>Trichuris: {stoolPresence.Trichuris}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
