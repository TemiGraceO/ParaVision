import base64
import cv2
import numpy as np
from pathlib import Path
from ultralytics import YOLO

# ===== CONFIGURATION =====
BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "stool.pt"  # ? Use quantized model (must exist!)
CLASS_NAMES = ["Hookworm", "Ascaris", "Trichuris"]

# Load model with error handling
try:
    stool_model = YOLO(str(MODEL_PATH))
    stool_model.to("cpu")  # Orange Pi doesn't have GPU
    print(f"[STOOL] Model loaded from {MODEL_PATH}")
except Exception as e:
    print(f"[STOOL] CRITICAL ERROR: {e}")
    stool_model = None

def run_detection_stool(b64_image: str):
    """
    Optimized stool detection with:
    - 224x224 input resolution (matches model training)
    - Quantized model for faster CPU inference
    - Reduced detection threshold
    - Max detections limit
    """
    if stool_model is None:
        return {"success": False, "error": "Model not loaded"}

    try:
        # --------- STEP 1: Decode image ----------
        if "," in b64_image:
            b64_image = b64_image.split(",")[1]

        img_data = base64.b64decode(b64_image)
        img = cv2.imdecode(np.frombuffer(img_data, np.uint8), cv2.IMREAD_COLOR)

        if img is None:
            return {"success": False, "error": "Invalid image data"}

        # --------- STEP 2: Optimize image ----------
        # Single resize operation (critical for speed)
        img_resized = cv2.resize(img, (224, 224))  # Match model input size

        # --------- STEP 3: Run detection ----------
        results = stool_model(
            img_resized,
            imgsz=224,        # Must match resize
            conf=0.45,        # Higher threshold = fewer boxes
            verbose=False,    # Disable logging
            max_det=6,        # Limit detections per frame
            classes=[0, 1, 2] # Only detect specified classes
        )

        # --------- STEP 4: Process results ----------
        boxes = []
        detected_types = set()

        for r in results:
            for box in r.boxes:
                # Extract coordinates (already in 0-224 range)
                x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                conf = float(box.conf.item())
                cls_id = int(box.cls.item())
                
                # Get class name safely
                if cls_id < len(CLASS_NAMES):
                    cls_name = CLASS_NAMES[cls_id]
                else:
                    cls_name = f"Class_{cls_id}"
                    continue  # Skip unknown classes

                # Store detection
                boxes.append({
                    "x1": x1,
                    "y1": y1,
                    "x2": x2,
                    "y2": y2,
                    "confidence": conf,
                    "class_name": cls_name
                })
                detected_types.add(cls_name)

        # --------- STEP 5: Return results ----------
        return {
            "success": True,
            "boxes": boxes,
            "result": {
                "status": "Ova Present" if boxes else "Ova Absent",
                "count": len(boxes),
                "ova_types": list(detected_types)
            }
        }

    except Exception as e:
        # Simplified error handling (reduces overhead)
        return {"success": False, "error": str(e)[:100]}  # Truncate long errors