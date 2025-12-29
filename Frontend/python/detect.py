# Frontend/python/detect.py
import sys, json, base64, logging
import numpy as np
import cv2
from pathlib import Path
from ultralytics import YOLO

logging.basicConfig(level=logging.INFO)

# ---------- LOAD MODEL ----------
BASE_DIR = Path(__file__).parent
MODEL_PATH = BASE_DIR / "malaria.pt"

model = YOLO(str(MODEL_PATH))
logging.info("YOLO model loaded successfully")

# ---------- HELPERS ----------
def decode_image(b64: str):
    if b64.startswith("data:image"):
        b64 = b64.split(",")[1]
    img_bytes = base64.b64decode(b64)
    img_np = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(img_np, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Invalid image")
    return img

def detect_from_base64(b64_image: str):
    img = decode_image(b64_image)
    results = model(img, conf=0.25)

    boxes = []
    for r in results:
        if r.boxes is None:
            continue
        for b in r.boxes:
            x1, y1, x2, y2 = b.xyxy[0].tolist()
            boxes.append({
                "x": x1,
                "y": y1,
                "width": x2 - x1,
                "height": y2 - y1,
                "confidence": float(b.conf[0]),
                "class": int(b.cls[0])
            })
    return boxes

# ---------- MAIN CLI (optional) ----------
if __name__ == "__main__":
    # Accept JSON input from stdin
    try:
        data = json.load(sys.stdin)
        image_b64 = data.get("image")
        if not image_b64:
            raise ValueError("No image provided")
        boxes = detect_from_base64(image_b64)
        print(json.dumps({"success": True, "count": len(boxes), "boxes": boxes}))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
