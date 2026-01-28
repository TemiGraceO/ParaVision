import json
import shutil
import uuid
import logging
import subprocess
import time
import base64
from escpos.printer import Usb

from pathlib import Path
from typing import Dict, Any, Optional
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI, HTTPException, UploadFile, File, Body
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

from python.detect import run_detection
from python.detect_stool import run_detection_stool

# ================== LOGGING ==================
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s"
)
logger = logging.getLogger("paravision")

# ================== PATHS ==================
BASE_DIR = Path(__file__).resolve().parent
IMAGE_DIR = BASE_DIR / "saved_images"
PATIENTS_DIR = BASE_DIR / "patients"
TESTS_DIR = BASE_DIR / "tests"
CONFIG_FILE = BASE_DIR / "config.json"
EXPORTS_DIR = BASE_DIR.parent / "exports"  # /mnt/ssd/paravision/exports
EXPORTS_DIR.mkdir(exist_ok=True)

for d in (IMAGE_DIR, PATIENTS_DIR, TESTS_DIR):
    d.mkdir(exist_ok=True)

# ================== GPIO ==================
BLOOD_PIN_WPI = 5
STOOL_PIN_WPI = 22

def _run_cmd(cmd: str) -> bool:
    try:
        subprocess.run(
            cmd,
            shell=True,
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        return True
    except Exception as e:
        logger.error(f"GPIO failed: {cmd} | {e}")
        return False

def gpio_mode_out(pin: int):
    _run_cmd(f"gpio mode {pin} out")

def gpio_write(pin: int, value: int):
    _run_cmd(f"gpio write {pin} {value}")

# ================== FASTAPI LIFESPAN ==================
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("GPIO INIT")
    gpio_mode_out(BLOOD_PIN_WPI)
    gpio_mode_out(STOOL_PIN_WPI)
    gpio_write(BLOOD_PIN_WPI, 0)
    gpio_write(STOOL_PIN_WPI, 0)
    yield
    logger.info("GPIO SHUTDOWN")
    gpio_write(BLOOD_PIN_WPI, 0)
    gpio_write(STOOL_PIN_WPI, 0)

# ================== APP ==================
app = FastAPI(lifespan=lifespan)

app.mount("/images", StaticFiles(directory=IMAGE_DIR), name="images")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================== MODELS ==================
class Patient(BaseModel):
    id: str
    name: str
    dob: str
    gender: str
    date: str

class Test(BaseModel):
    patientId: str
    patientName: str
    type: str
    smear: str
    date: str
    status: str = "pending"
    result: dict | None = None
    analysis: dict | None = None

class ExportAnalyticsPayload(BaseModel):
    timeRange: str
    testType: str
    gender: str
    stats: Dict[str, Any]
    targetDrive: Optional[str] = None  # ? Add this line

class PrintReportRequest(BaseModel):
    patient: Dict[str, Any]
    test: Dict[str, Any]
    analysis: Dict[str, Any]

# ================== HELPERS ==================
def atomic_write(path: Path, data: Dict[str, Any]):
    tmp = path.with_suffix(".tmp")
    with open(tmp, "w") as f:
        json.dump(data, f, indent=2)
    tmp.replace(path)

def safe_load_json(path: Path) -> Optional[Dict[str, Any]]:
    try:
        if not path.exists() or path.stat().st_size == 0:
            return None
        with open(path) as f:
            return json.load(f)
    except json.JSONDecodeError:
        logger.error(f"Corrupted JSON skipped: {path}")
        return None

# ================== CONFIG ==================
@app.get("/api/config")
async def get_config():
    return safe_load_json(CONFIG_FILE) or {}

@app.post("/api/config")
async def save_config(config: Dict[str, Any]):
    atomic_write(CONFIG_FILE, config)
    return {"ok": True}

# ================== PATIENTS ==================
@app.post("/api/patients")
async def create_patient(patient: Patient):
    folder = PATIENTS_DIR / patient.id
    folder.mkdir(parents=True, exist_ok=True)
    atomic_write(folder / "data.json", patient.dict())
    return {"ok": True}

@app.get("/api/patients")
async def list_patients():
    patients = []
    for d in PATIENTS_DIR.iterdir():
        data = safe_load_json(d / "data.json")
        if data:
            patients.append(data)
    return sorted(patients, key=lambda x: x.get("date", ""), reverse=True)

@app.get("/api/patients/{patient_id}")
async def get_patient(patient_id: str):
    data = safe_load_json(PATIENTS_DIR / patient_id / "data.json")
    if not data:
        raise HTTPException(404, "Patient not found")
    return data

@app.put("/api/patients/{patient_id}")
async def update_patient(patient_id: str, patient: Patient):
    if patient.id != patient_id:
        raise HTTPException(400, "Patient ID cannot be changed")

    folder = PATIENTS_DIR / patient_id
    if not folder.exists():
        raise HTTPException(404, "Patient not found")

    atomic_write(folder / "data.json", patient.dict())
    return {"ok": True}

@app.delete("/api/patients/{patient_id}")
async def delete_patient(patient_id: str):
    folder = PATIENTS_DIR / patient_id
    if not folder.exists():
        raise HTTPException(404, "Patient not found")
    shutil.rmtree(folder)
    return {"ok": True}

@app.put("/api/tests/{test_id}/results")
async def save_test_results(
    test_id: str,
    payload: Dict[str, Any] = Body(...)
):
    for f in TESTS_DIR.glob("*.json"):
        data = safe_load_json(f)
        if data and data.get("id") == test_id:
            data["status"] = "completed"
            data["result"] = payload.get("result")
            data["analysis"] = payload.get("analysis")
            atomic_write(f, data)
            return {"ok": True}

    raise HTTPException(404, "Test not found")

# ================== TESTS ==================
@app.post("/api/tests")
async def create_test(test: Test):
    test_id = str(uuid.uuid4())
    atomic_write(
        TESTS_DIR / f"{test.patientId}_{test_id}.json",
        {**test.dict(), "id": test_id},
    )
    return {"id": test_id}

@app.get("/api/tests")
async def get_tests(patientId: Optional[str] = None):
    time.sleep(0.1)
    results = []
    for f in TESTS_DIR.glob("*.json"):
        data = safe_load_json(f)
        if not data:
            continue
        if patientId and data.get("patientId") != patientId:
            continue
        results.append(data)
    return results

@app.put("/api/tests/{test_id}")
async def update_test(test_id: str, test_data: dict):
    # Search for the test file
    for f in TESTS_DIR.glob("*.json"):
        data = safe_load_json(f)
        if data and data.get("id") == test_id:
            # Update the test data
            data.update(test_data)
            atomic_write(f, data)
            return data

    raise HTTPException(404, "Test not found")

# ================== GPIO API ==================

@app.get("/api/drives")
async def list_drives():
    """List ONLY external/removable drives (USB, flash drives, external HDDs)"""
    try:
        # Method 1: Check /run/media and /media (typical USB mount locations)
        media_paths = []
        for base in ['/run/media/HwHiAiUser', '/media/HwHiAiUser', '/media', '/run/media']:
            if Path(base).exists():
                media_paths.extend(Path(base).iterdir())
        
        # Method 2: Use lsblk to find removable devices
        result = subprocess.run(['lsblk', '-o', 'NAME,RM,MOUNTPOINT', '-n'], 
                              capture_output=True, text=True, check=True)
        
        external_drives = []
        lines = result.stdout.strip().split('\n')
        
        for line in lines:
            parts = line.split()
            if len(parts) >= 3 and parts[1] == '1':  # RM=1 means removable
                mountpoint = parts[2] if parts[2] else 'Not mounted'
                if mountpoint and mountpoint not in ['/', '/boot', '/home']:
                    device_name = parts[0]
                    # Get more info about this device
                    df_result = subprocess.run(['df', '-h', '-T', mountpoint], 
                                             capture_output=True, text=True)
                    df_lines = df_result.stdout.strip().split('\n')
                    if len(df_lines) > 1:
                        df_parts = df_lines[1].split()
                        external_drives.append({
                            "mountpoint": mountpoint,
                            "fstype": df_parts[1] if len(df_parts) > 1 else "unknown",
                            "size": df_parts[1] if len(df_parts) > 1 else "?",
                            "avail": df_parts[3] if len(df_parts) > 4 else "?",
                            "device": f"/dev/{device_name}"
                        })
        
        # Also check common USB filesystem types (vfat, exfat, ntfs)
        df_result = subprocess.run(['df', '-h', '-T'], 
                                 capture_output=True, text=True, check=True)
        lines = df_result.stdout.strip().split('\n')[1:]
        
        for line in lines:
            parts = line.split()
            if len(parts) >= 6:
                fstype, size, used, avail, use_pct, mountpoint = parts[:6]
                # External drive filesystems
                if fstype in ['vfat', 'exfat', 'ntfs', 'FAT32'] and \
                   mountpoint.startswith(('/media/', '/run/media/')):
                    external_drives.append({
                        "mountpoint": mountpoint,
                        "fstype": fstype,
                        "size": size,
                        "used": used,
                        "avail": avail,
                        "use": use_pct,
                        "device": "USB"
                    })
        
        # Remove duplicates
        unique_drives = []
        seen_mounts = set()
        for drive in external_drives:
            if drive['mountpoint'] not in seen_mounts:
                unique_drives.append(drive)
                seen_mounts.add(drive['mountpoint'])
        
        return {"drives": unique_drives}
    except Exception as e:
        logger.error(f"Drive listing error: {e}")
        raise HTTPException(500, f"Failed to list external drives: {str(e)}")

@app.post("/api/export-analysis-csv")
async def export_analysis_csv(payload: ExportAnalyticsPayload):
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = EXPORTS_DIR / f"analysis_{timestamp}.csv"

    import csv
    try:
        with filename.open("w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow([
                "time_range",
                "test_type",
                "gender",
                "total_tests",
                "positive_tests",
                "negative_tests",
                "positive_rate",
                "new_patients",
                "tests_trend",
                "rate_trend",
                "patients_trend",
            ])
            s = payload.stats
            writer.writerow([
                payload.timeRange,
                payload.testType,
                payload.gender,
                s.get("totalTests"),
                s.get("positiveTests"),
                s.get("negativeTests"),
                s.get("positiveRate"),
                s.get("newPatients"),
                s.get("testsTrend"),
                s.get("rateTrend"),
                s.get("patientsTrend"),
            ])
    except Exception as e:
        raise HTTPException(500, f"Failed to write CSV: {e}")

    return {"ok": True, "path": str(filename)}

@app.post("/gpio/set")
async def set_gpio(payload: Dict[str, bool]):
    if "LED_1" in payload:
        gpio_write(BLOOD_PIN_WPI, int(payload["LED_1"]))
    if "LED_2" in payload:
        gpio_write(STOOL_PIN_WPI, int(payload["LED_2"]))
    return {"ok": True}

@app.post("/gpio/restore")
async def gpio_restore():
    gpio_write(BLOOD_PIN_WPI, 0)
    gpio_write(STOOL_PIN_WPI, 0)
    return {"ok": True}

# ================== DETECTION ==================
@app.post("/detect")
async def detect(file: UploadFile = File(...)):
    img = base64.b64encode(await file.read()).decode()
    result = run_detection(img)
    if not result.get("success"):
        raise HTTPException(500, result.get("error"))
    return result

@app.post("/detect_stool")
async def detect_stool(file: UploadFile = File(...)):
    img = base64.b64encode(await file.read()).decode()
    result = run_detection_stool(img)
    if not result.get("success"):
        raise HTTPException(500, result.get("error"))
    return result

# ================== PRINT ==================
from escpos.printer import Usb

@app.post("/api/print-report")
async def print_report_backend(data: dict = Body(...)):
    """
    Print a lab report. Accepts either:
    - {"test_id": "<uuid>"}
    - OR full data: {"patient": {...}, "test": {...}, "analysis": {...}}
    """
    test_id = data.get("test_id")
    patient_data = data.get("patient")
    test_data = data.get("test")
    analysis = data.get("analysis", {})

    if not test_id and not (patient_data and test_data):
        raise HTTPException(400, "Either test_id or full patient/test data is required")

    if test_id:
        # Load test data from file
        test_file = None
        for f in TESTS_DIR.glob("*.json"):
            d = safe_load_json(f)
            if d and d.get("id") == test_id:
                test_file = f
                test_data = d
                break
        if not test_file:
            raise HTTPException(404, "Test not found")

        # Load patient data
        patient_id = test_data.get("patientId")
        patient_file = PATIENTS_DIR / patient_id / "data.json"
        patient_data = safe_load_json(patient_file)
        if not patient_data:
            raise HTTPException(404, "Patient not found")

        # Load analysis if not provided
        if not analysis:
            analysis = test_data.get("analysis", {})

    # --- Load hospital config ---
    config = safe_load_json(CONFIG_FILE) or {}
    hospital = config.get("hospitalName", "ParaVision Diagnostics")
    tested_by = config.get("testBy", "________________")

    # --- Determine test type ---
    test_type = (test_data.get("type") or "").lower()
    is_blood = "blood" in test_type or "malaria" in test_type
    is_stool = "stool" in test_type

    # --- Connect to USB printer ---
    try:
        p = Usb(0x0483, 0x5840, interface=0, out_ep=0x04)
        p.hw("INIT")
        time.sleep(0.1)

        # ===== HEADER =====
        p.set(align="center", bold=True, width=2, height=2)
        p.text(f"{hospital}\n")
        p.set(align="center", bold=False, width=1, height=1)
        p.text("Official Laboratory Report\n")
        p.text("="*32 + "\n")

        # ===== PATIENT INFO =====
        p.set(align="left", bold=True)
        p.text("Patient Information\n")
        p.set(bold=False)
        p.text(f"Name : {patient_data.get('name','-')}\n")
        p.text(f"ID : {patient_data.get('id','-')}\n")
        p.text(f"DOB : {patient_data.get('dob','-')}\n")
        p.text(f"Gender : {patient_data.get('gender','-')}\n")
        p.text("-"*32 + "\n")

        # ===== TEST INFO =====
        p.set(bold=True)
        p.text("Test Information\n")
        p.set(bold=False)
        p.text(f"Test : {test_data.get('type','-')}\n")
        p.text(f"Method : {test_data.get('smear','-')}\n")
        p.text(f"Date : {datetime.now().strftime('%d/%m/%Y %H:%M')}\n")
        p.text("-"*32 + "\n")

        # ===== RESULTS =====
        p.set(bold=True)
        p.text("Results\n")
        p.set(bold=False)

        if is_blood:
            p.set(bold=True)
            p.text("Blood Examination\n")
            p.set(bold=False)
            p.text(f"Malaria Status : Positive\n")
            p.text(f"Parasite count : 6\n")
            p.text("-"*32 + "\n")

        if is_stool:
            stool = analysis.get("stool", {"Ascaris":"-", "Hookworm":"-", "Trichuris":"-"})
            p.set(bold=True)
            p.text("Stool Examination\n")
            p.set(bold=False)
            p.text(f"Ascaris : {stool.get('Ascaris','-')}\n")
            p.text(f"Hookworm : {stool.get('Hookworm','-')}\n")
            p.text(f"Trichuris : {stool.get('Trichuris','-')}\n")
            p.text("-"*32 + "\n")

        # ===== FOOTER =====
        p.set(bold=True)
        p.text("Tested By: ")
        p.set(bold=False)
        p.text(f"{tested_by}\n\n")
        p.text("Signature: __________________\n")

        p.cut()
        p.close()

        return {"printed": True}

    except Exception as e:
        logger.exception("Printer error")
        raise HTTPException(500, str(e))
# ================== ROOT ==================
@app.get("/")
async def root():
    return {"service": "ParaVision Backend", "status": "running"}

# ================== RUN ==================
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
