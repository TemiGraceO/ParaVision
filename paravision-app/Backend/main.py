from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json, shutil, logging
from pathlib import Path
from datetime import datetime, timedelta
import uuid
CONFIG_FILE = Path("config.json")

logging.basicConfig(level=logging.DEBUG)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8000", "http://localhost"],  # adjust as needed
    allow_methods=["*"],
    allow_headers=["*"],
)

class Patient(BaseModel):
    id: str
    name: str
    age: int
    gender: str
    date: str

class Test(BaseModel):
    patientId: str
    name: str
    type: str  # "Blood", "Stool", "Both"
    smear: str
    date: str
    result: str

class Config(BaseModel):
    hospitalName: str
    hostpitalID: int
    labId: int
    address: str
    testBy: str

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
    old_folder = Path("patients") / patient_id
    new_folder = Path("patients") / patient.id

    if not old_folder.is_dir():
        raise HTTPException(404, f"Patient {patient_id} not found")

    if patient_id != patient.id:
        if new_folder.exists():
            raise HTTPException(400, "A patient with this new ID already exists")
        old_folder.rename(new_folder)

    with open(new_folder / "data.json", "w") as f:
        json.dump(patient.dict(), f)

    return {"ok": True, "patient": patient.dict()}


@app.post("/api/tests")
async def create_test(test: Test):
    test_id = str(uuid.uuid4())
    folder = Path("tests").resolve()
    folder.mkdir(exist_ok=True)
    file = folder / f"{test.patientId}_{test_id}.json"
    test_data = {**test.dict(), "id": test_id}
    with open(file, "w") as f:
        json.dump(test_data, f)
    # return the saved test object so frontend receives full data
    return test_data

@app.get("/api/tests")
async def get_tests(patientId: str = None):
    tests = []
    folder = Path("tests").resolve()
    folder.mkdir(exist_ok=True)
    for f in folder.glob("*.json"):
        with open(f) as file:
            test = json.load(file)
            if patientId and test["patientId"] != patientId:
                continue
            tests.append(test)
    # optional: sort by date desc
    try:
        tests.sort(key=lambda x: x.get("date",""), reverse=True)
    except Exception:
        pass
    return tests

@app.post("/api/config")
async def save_config(config: Config):
    with open(CONFIG_FILE, "w") as f:
        json.dump(config.dict(), f)
    return {"ok": True}

@app.get("/api/config")
async def get_config():
    if not CONFIG_FILE.exists():
        return {}
    with open(CONFIG_FILE) as f:
        return json.load(f)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
