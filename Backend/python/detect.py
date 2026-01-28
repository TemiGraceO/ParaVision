import base64
import cv2
import numpy as np
from pathlib import Path
from ultralytics import YOLO

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "malaria.pt"  # Use quantized model!

try:
    malaria_model = YOLO(str(MODEL_PATH))
    malaria_model.to("cpu")
    print("[MALARIA] Model loaded.")
except Exception as e:
    print(f"[MALARIA] Error: {e}")
    malaria_model = None

def run_detection(b64_image: str):
    if malaria_model is None:
        return {"success": False, "error": "Model not loaded"}
    
    try:
        # Extract image data
        if "," in b64_image:
            b64_image = b64_image.split(",")[1]
        
        img_data = base64.b64decode(b64_image)
        img = cv2.imdecode(np.frombuffer(img_data, np.uint8), cv2.IMREAD_COLOR)
        
        # Single resize operation
        img_resized = cv2.resize(img, (224, 224))  # Match training size
        
        # Run detection with lower confidence threshold
        results = malaria_model(
            img_resized, 
            imgsz=224, 
            conf=0.3,    # Lower confidence = fewer boxes
            verbose=False,
            max_det=10  # Limit detections per frame
        )
        
        boxes = []
        for r in results:
            for box in r.boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                conf = float(box.conf.item())
                cls_id = int(box.cls.item())
                cls_name = malaria_model.names[cls_id]

                # Only return necessary data
                boxes.append({
                    "x1": x1,
                    "y1": y1,
                    "x2": x2,
                    "y2": y2,
                    "confidence": conf,
                    "class_name": cls_name
                })

        return {"success": True, "boxes": boxes}
    except Exception as e:
        return {"success": False, "error": str(e)}