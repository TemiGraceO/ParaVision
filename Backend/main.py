from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json, shutil, logging, base64, cv2, numpy as np
from pathlib import Path
from datetime import datetime
import uuid

try:
    import onnxruntime as ort
    ONNX_AVAILABLE = True
except ImportError:
    ONNX_AVAILABLE = False
    print("?? onnxruntime not installed. Run: pip install onnxruntime")

# ========== CONFIG ==========
CONFIG_FILE = Path("config.json")
MODEL_PATH = Path("python/model.onnx")  # Adjust to your model location
INPUT_SIZE = (224, 224)
CONF_THRESH = 0.25
NMS_THRESH = 0.45

logging.basicConfig(level=logging.DEBUG)

# ========== LOAD YOLO MODEL ==========
session = None
input_name = None

if ONNX_AVAILABLE and MODEL_PATH.exists():
    try:
        session = ort.InferenceSession(str(MODEL_PATH), providers=['CPUExecutionProvider'])
        input_name = session.get_inputs()[0].name
        output_name = session.get_outputs()[0].name
        print(f"? YOLO model loaded: {MODEL_PATH}")
        print(f"   Input: {input_name}, Output: {output_name}")
    except Exception as e:
        print(f"? Model load failed: {e}")
        session = None
else:
    print(f"?? Model not found at {MODEL_PATH} or onnxruntime not installed")

# ========== FASTAPI APP ==========
app = FastAPI(title="Medical Detection API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========== PYDANTIC MODELS ==========
class Patient(BaseModel):
    id: str
    name: str
    age: int
    gender: str
    date: str

class Test(BaseModel):
    patientId: str
    name: str
    type: str
    smear: str
    date: str
    result: str

class Config(BaseModel):
    hospitalName: str
    hostpitalID: int
    labId: int
    address: str
    testBy: str

class FrameData(BaseModel):
    frame: str  # base64 encoded image

# ========== YOLO DETECTION FUNCTIONS ==========
def preprocess_image(frame):
    """Letterbox resize + normalize for YOLO"""
    h, w = frame.shape[:2]
    scale = min(INPUT_SIZE[0]/w, INPUT_SIZE[1]/h)
    new_w, new_h = int(w * scale), int(h * scale)
    
    resized = cv2.resize(frame, (new_w, new_h), interpolation=cv2.INTER_LINEAR)
    
    # Pad to square
    padded = np.full((INPUT_SIZE[1], INPUT_SIZE[0], 3), 114, dtype=np.uint8)
    top_pad = (INPUT_SIZE[1] - new_h) // 2
    left_pad = (INPUT_SIZE[0] - new_w) // 2
    padded[top_pad:top_pad+new_h, left_pad:left_pad+new_w] = resized
    
    # BGR?RGB + Normalize [0,1]
    rgb = cv2.cvtColor(padded, cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0
    
    # HWC ? CHW ? NCHW
    input_tensor = np.transpose(rgb, (2, 0, 1))[np.newaxis, ...]
    
    return input_tensor, scale, (left_pad, top_pad)

def postprocess_detections(outputs, scale, pad):
    """Extract bounding boxes from YOLO output"""
    predictions = outputs[0][0]  # Shape: [num_detections, 85] for YOLOv5/v8
    
    boxes = []
    confidences = []
    
    for detection in predictions:
        scores = detection[4:]
        class_id = np.argmax(scores)
        confidence = scores[class_id]
        
        if confidence > CONF_THRESH:
            cx, cy, w, h = detection[:4]
            
            # Convert to pixel coords and remove padding
            x1 = int((cx - w/2) * INPUT_SIZE[0] / scale - pad[0])
            y1 = int((cy - h/2) * INPUT_SIZE[1] / scale - pad[1])
            x2 = int((cx + w/2) * INPUT_SIZE[0] / scale - pad[0])
            y2 = int((cy + h/2) * INPUT_SIZE[1] / scale - pad[1])
            
            # Clamp to valid range
            x1, y1 = max(0, x1), max(0, y1)
            x2, y2 = max(x1+1, x2), max(y1+1, y2)
            
            if x2 > x1 and y2 > y1:
                boxes.append([x1, y1, x2, y2])
                confidences.append(float(confidence))
    
    # Non-Maximum Suppression
    if len(boxes) > 0:
        indices = cv2.dnn.NMSBoxes(boxes, confidences, CONF_THRESH, NMS_THRESH)
        if len(indices) > 0:
            indices = indices.flatten()
            return [[boxes[i][0], boxes[i][1], boxes[i][2], boxes[i][3], confidences[i]] for i in indices]
    
    return []

# ========== DETECTION ENDPOINT ==========
@app.post("/api/detect")
async def detect_frame(data: FrameData):
    """
    Receive base64 image, run YOLO detection, return bounding boxes.
    Returns: {"boxes": [[x1, y1, x2, y2, confidence], ...], "count": N}
    """
    if session is None:
        logging.warning("Detection called but model not loaded")
        return {"boxes": [], "count": 0, "error": "Model not loaded"}
    
    try:
        # Decode base64 image
        frame_data = data.frame
        if ',' in frame_data:
            frame_data = frame_data.split(',')[1]
        
        img_bytes = base64.b64decode(frame_data)
        nparr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            return {"boxes": [], "count": 0, "error": "Failed to decode image"}
        
        logging.debug(f"?? Frame received: {frame.shape}")
        
        # Preprocess
        input_tensor, scale, pad = preprocess_image(frame)
        
        # Run inference
        outputs = session.run(None, {input_name: input_tensor})
        
        # Postprocess
        boxes = postprocess_detections(outputs, scale, pad)
        
        logging.info(f"? Detected {len(boxes)} objects")
        
        return {
            "boxes": boxes,
            "count": len(boxes),
            "status": "success"
        }
        
    except Exception as e:
        logging.error(f"Detection error: {e}")
        return {"boxes": [], "count": 0, "error": str(e)}

# ========== HEALTH CHECK ==========
@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "model_loaded": session is not None,
        "model_path": str(MODEL_PATH)
    }

# ========== PATIENT ENDPOINTS ==========
@app.post("/api/patients")
async def create_patient(patient: Patient):
    folder = (Path("patients") / patient.id).resolve()
    folder.mkdir(parents=True, exist_ok=True)
    with open(folder / "data.json", "w") as f:
        json.dump(patient.dict(), f)
    return {"ok": True}

@app.get("/api/patients")
async def list_patients():
    patients = []
    patients_dir = Path("patients")
    if not patients_dir.exists():
        return patients
    for d in patients_dir.iterdir():
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

# ========== TEST ENDPOINTS ==========
@app.post("/api/tests")
async def create_test(test: Test):
    test_id = str(uuid.uuid4())
    folder = Path("tests").resolve()
    folder.mkdir(exist_ok=True)
    file = folder / f"{test.patientId}_{test_id}.json"
    test_data = {**test.dict(), "id": test_id}
    with open(file, "w") as f:
        json.dump(test_data, f)
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
    try:
        tests.sort(key=lambda x: x.get("date", ""), reverse=True)
    except Exception:
        pass
    return tests

# ========== CONFIG ENDPOINTS ==========
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

# ========== RUN SERVER ==========
if __name__ == "__main__":
    import uvicorn
    print("\n?? Starting Medical Detection API...")
    print(f"   Model: {'? Loaded' if session else '? Not loaded'}")
    print(f"   Docs: http://localhost:8000/docs\n")
    uvicorn.run(app, host="0.0.0.0", port=8000)
