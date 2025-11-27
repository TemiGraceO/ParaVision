from fastapi import FastAPI, HTTPException
import json,os
from pathlib import Path
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
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


@app.post("/api/patients")
async def create_patient(patient: Patient):
    folder = Path(f"patients/{patient.id}")
    folder.mkdir(exist_ok=True, parents=True)
    with open(folder / "data.json", "w") as f:
        json.dump(patient.dict(), f)
    return {"success": True, "id": patient.id}

@app.get("/api/patients")
def list_patients():
         patients = []
         for d in Path("patients").iterdir():
             if d.is_dir():
                 try:
                     with open(d / "data.json") as f:
                         patients.append(json.load(f))
                 except (FileNotFoundError, json.JSONDecodeError):
                     pass  # Skip invalid data
         return patients