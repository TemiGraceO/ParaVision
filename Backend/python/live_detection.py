#!/usr/bin/env python3
"""
PERFECT: Model ? Extract Boxes ? JSON ? Frontend Draws Rainbow Boxes
"""
import cv2
import numpy as np
import onnxruntime as ort
import json
import sys
import base64
import os

# ========== MODEL SETUP ==========
MODEL_PATH = 'model.onnx'
INPUT_SIZE = (640, 640)  # Your model's input size
CONF_THRESH = 0.25
NMS_THRESH = 0.45

print(f'?? Loading {MODEL_PATH}...', file=sys.stderr)

# Load ONNX model
providers = ['CPUExecutionProvider']
session = ort.InferenceSession(MODEL_PATH, providers=providers)
input_name = session.get_inputs()[0].name
output_name = session.get_outputs()[0].name

print(f'? Model ready: {input_name} ? {output_name}', file=sys.stderr)

def preprocess_image(image):
    """Letterbox resize + normalize for YOLO"""
    h, w = image.shape[:2]
    scale = min(INPUT_SIZE[0]/w, INPUT_SIZE[1]/h)
    new_w, new_h = int(w * scale), int(h * scale)
    
    resized = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_LINEAR)
    
    # Pad to square
    top_pad = (INPUT_SIZE[1] - new_h) // 2
    left_pad = (INPUT_SIZE[0] - new_w) // 2
    padded = np.full((INPUT_SIZE[1], INPUT_SIZE[0], 3), 114, dtype=np.uint8)
    padded[top_pad:top_pad+new_h, left_pad:left_pad+new_w] = resized
    
    # BGR?RGB + Normalize [0,1]
    rgb = cv2.cvtColor(padded, cv2.COLOR_BGR2RGB)
    normalized = rgb.astype(np.float32) / 255.0
    # HWC ? CHW
    input_tensor = np.transpose(normalized, (2, 0, 1))[np.newaxis, ...]
    
    return input_tensor, scale, (left_pad, top_pad)

def postprocess_detections(outputs, scale, pad, conf_thresh=CONF_THRESH, nms_thresh=NMS_THRESH):
    """Extract bounding boxes from model output"""
    predictions = outputs[0][0]  # [1, 8400, 85] typical YOLO
    
    boxes = []
    confidences = []
    class_ids = []
    
    # Parse detections
    for detection in predictions:
        # [x_center, y_center, width, height, obj_conf, class_scores...]
        scores = detection[4:]
        class_id = np.argmax(scores)
        confidence = scores[class_id]
        
        if confidence > conf_thresh:
            # Convert center format to corners
            cx, cy, w, h = detection[0:4]
            
            # Denormalize to pixels
            x1 = (cx - w/2) * INPUT_SIZE[0] / scale - pad[0]
            y1 = (cy - h/2) * INPUT_SIZE[1] / scale - pad[1]
            x2 = (cx + w/2) * INPUT_SIZE[0] / scale - pad[0]
            y2 = (cy + h/2) * INPUT_SIZE[1] / scale - pad[1]
            
            # Valid box check
            if x2 > x1 and y2 > y1 and x1 >= 0 and y1 >= 0:
                boxes.append([int(x1), int(y1), int(x2), int(y2)])
                confidences.append(float(confidence))
                class_ids.append(int(class_id))
    
    # Non-Maximum Suppression
    indices = cv2.dnn.NMSBoxes(boxes, confidences, conf_thresh, nms_thresh)
    
    final_boxes = []
    if len(indices) > 0:
        indices = indices.flatten()
        for i in indices:
            final_boxes.append([boxes[i][0], boxes[i][1], boxes[i][2], boxes[i][3], confidences[i]])
    
    return final_boxes

# ========== MAIN LOOP ==========
while True:
    try:
        line = sys.stdin.readline().strip()
        if not line:
            continue
            
        print(f'?? Processing frame ({len(line)} bytes)', file=sys.stderr)
        
        # Decode base64 image from React
        if line.startswith('data:image'):
            img_data = base64.b64decode(line.split(',', 1)[1])
        else:
            img_data = base64.b64decode(line)
            
        nparr = np.frombuffer(img_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            result = {'status': 'error', 'message': 'Decode failed', 'boxes': [], 'count': 0}
        else:
            # Run inference pipeline
            input_tensor, scale, pad = preprocess_image(frame)
            outputs = session.run(None, {input_name: input_tensor})
            boxes = postprocess_detections(outputs, scale, pad)
            
            result = {
                'status': 'success',
                'boxes': boxes,
                'count': len(boxes),
                'frame_time': len(line)
            }
        
        # Send to frontend (React draws rainbow boxes!)
        print(json.dumps(result))
        sys.stdout.flush()
        print(f'? Sent {len(boxes)} bounding boxes to frontend', file=sys.stderr)
        
    except KeyboardInterrupt:
        break
    except Exception as e:
        result = {'status': 'error', 'error': str(e), 'boxes': [], 'count': 0}
        print(json.dumps(result))
        sys.stdout.flush()
        print(f'? Error: {str(e)}', file=sys.stderr)
