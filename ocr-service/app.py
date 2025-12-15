from fastapi import FastAPI, UploadFile, File
from paddleocr import PaddleOCR
import numpy as np
import cv2
import uvicorn
import logging

# Initialize Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ocr-service")

app = FastAPI(title="PaddleOCR Service")

# Initialize PaddleOCR
# Disabling angle classifier to prevent model issues for now
try:
    logger.info("Loading PaddleOCR model...")
    ocr = PaddleOCR(use_angle_cls=False, lang='en') 
    logger.info("PaddleOCR model loaded successfully.")
except Exception as e:
    logger.error(f"Failed to load PaddleOCR model: {e}")
    raise e

@app.get("/")
def health_check():
    return {"status": "running", "service": "paddleocr-api"}

@app.post("/ocr")
async def extract_text(file: UploadFile = File(...)):
    try:
        logger.info(f"Processing file: {file.filename}")
        
        # Read image file
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            return {"success": False, "error": "Invalid image data"}

        # Perform OCR
        print("Starting OCR inference...", flush=True)
        result = ocr.ocr(img)
        print(f"OCR Result type: {type(result)}", flush=True)
        print(f"OCR Result: {result}", flush=True)

        extracted_text = ""
        confidence_sum = 0
        count = 0

        # Parse results
        if result:
            logger.info("Parsing Result...")
            lines = []
            
            # Check if result is a list of lists (Standard) or a list of dicts (New/Structure)
            first_item = result[0]
            
            if isinstance(first_item, dict):
                logger.info("Parsing dictionary result format...")
                # Extract text and confidence from dictionary keys found in logs
                # Keys: rec_texts, rec_scores, rec_boxes, etc.
                if 'rec_texts' in first_item:
                    rec_texts = first_item['rec_texts']
                    rec_scores = first_item.get('rec_scores', [])
                    
                    if isinstance(rec_texts, list):
                        lines = rec_texts
                        count = len(lines)
                        if count > 0 and len(rec_scores) == count:
                            confidence_sum = sum(rec_scores)
            
            elif isinstance(first_item, list):
                # Standard [[box, (text, conf)], ...] format
                for line in result[0]:
                    if line and len(line) > 1:
                        text_info = line[1]
                        if text_info and len(text_info) > 1:
                            text = text_info[0]
                            conf = text_info[1]
                            lines.append(text)
                            confidence_sum += conf
                            count += 1
            
            extracted_text = "\n".join(lines)
        
        avg_confidence = (confidence_sum / count) if count > 0 else 0

        return {
            "success": True,
            "text": extracted_text,
            "confidence": avg_confidence,
            "lines": count
        }

    except Exception as e:
        logger.error(f"OCR Error: {str(e)}")
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
