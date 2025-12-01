from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json, shutil, logging
from pathlib import Path
from datetime import datetime, timedelta
import uuid

logging.basicConfig(level=logging.DEBUG)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class Patient(BaseModel):
    id: str
    name: str
    age: int
    gender: str
    date: str

@app.post("/api/patients")
async def create_patient(patient: Patient):
    folder = (Path("patients") / patient.id).resolve()
    folder.mkdir(exist_ok=True)
    with open(folder / "data.json", "w") as f:
        json.dump(patient.dict(), f)
    return {"ok": True}

@app.get("/api/patients")
async def list_patients():
    patients = []
    for d in Path("patients").iterdir():
        if d.is_dir():
            try:
                with open(d / "data.json") as f:
                    patients.append(json.load(f))
            except Exception as e:
                logging.error(f"Skipping {d}: {e}")
    return patients

@app.delete("/api/patients/{patient_id}")
async def delete_patient(patient_id: str):
    folder = (Path("patients") / patient_id.strip()).resolve()
    if not folder.is_dir():
        raise HTTPException(404, f"Not found: {patient_id}")
    try:
        shutil.rmtree(folder)
        return {"success": True, "message": f"Deleted {patient_id}"}
    except Exception as e:
        logging.error(f"Error: {e}")
        raise HTTPException(500, f"Failed: {e}")

@app.put("/api/patients/{patient_id}")
async def update_patient(patient_id: str, patient: Patient):
    folder = (Path("patients") / patient_id).resolve()
    if not folder.is_dir():
        raise HTTPException(404, f"Patient {patient_id} not found")
    with open(folder / "data.json", "w") as f:
        json.dump(patient.dict(), f)
    return {"ok": True}

class Test(BaseModel):
    patientId: str
    name: str
    type: str  # "Blood", "Stool", "Both"
    smear: str
    date: str
    result: str

@app.post("/api/tests")
async def create_test(test: Test):
    test_id = str(uuid.uuid4())
    folder = Path("tests").resolve()
    folder.mkdir(exist_ok=True)
    file = folder / f"{test.patientId}_{test.date}_{test_id}.json"
    with open(file, "w") as f:
        json.dump({**test.dict(), "id": test_id}, f)
    return {"ok": True}

@app.get("/api/tests")
async def get_tests(search: str = "", sampleType: str = "", dateRange: str = ""):
    tests = []
    for f in Path("tests").glob("*.json"):
        with open(f) as file:
            tests.append(json.load(file))
    # Filter logic
    if search:
        tests = [t for t in tests if search in t["patientId"] or search in t["date"]]
    if sampleType and sampleType != "All":
        tests = [t for t in tests if t["type"] == sampleType]
    if dateRange:
        days = {"7d": 7, "30d": 30, "6m": 180}[dateRange]
        cutoff = (datetime.now() - timedelta(days=days)).isoformat()
        tests = [t for t in tests if t["date"] >= cutoff[:10]]
    return tests

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)