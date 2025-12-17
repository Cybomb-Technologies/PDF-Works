from fastapi import FastAPI, UploadFile, File
from paddleocr import PaddleOCR
import numpy as np
import cv2
import uvicorn
import logging
from pdf2image import convert_from_bytes
from io import BytesIO

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
        
        contents = await file.read()
        images = []
        
        # Check if PDF
        if file.filename.lower().endswith('.pdf'):
            logger.info("Detected PDF file. Converting to images...")
            try:
                # Convert PDF bytes to PIL images
                pil_images = convert_from_bytes(contents)
                for pil_img in pil_images:
                    # Convert PIL RGB to OpenCV BGR
                    open_cv_image = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
                    images.append(open_cv_image)
                logger.info(f"Converted PDF to {len(images)} images.")
            except Exception as pdf_error:
                return {"success": False, "error": f"PDF Conversion Error: {str(pdf_error)}"}
        else:
            # Assume Image
            nparr = np.frombuffer(contents, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img is None:
                return {"success": False, "error": "Invalid image data"}
            images.append(img)

        full_extracted_text = []
        total_confidence = 0
        total_lines = 0

        # Process each image (page)
        print("Starting OCR inference...", flush=True)
        
        for i, img in enumerate(images):
            # Perform OCR
            result = ocr.ocr(img)
            
            page_text = ""
            page_conf_sum = 0
            page_lines_count = 0
            lines = []

            # Parse results
            if result:
                # Handle PaddleOCR result format (list of lists or list of dicts)
                first_item = result[0]
                
                if isinstance(first_item, dict) and 'rec_texts' in first_item:
                     # Structured result
                    rec_texts = first_item['rec_texts']
                    rec_scores = first_item.get('rec_scores', [])
                    if isinstance(rec_texts, list):
                         lines = rec_texts
                         page_lines_count = len(lines)
                         if page_lines_count > 0 and len(rec_scores) == page_lines_count:
                             page_conf_sum = sum(rec_scores)
                             
                elif isinstance(first_item, list):
                    # Standard [[box, (text, conf)], ...] format
                    # Sometimes result[0] is None if no text found
                    if first_item is None:
                        continue

                    for line in first_item:
                        if line and len(line) > 1:
                            text_info = line[1]
                            if text_info and len(text_info) > 1:
                                text = text_info[0]
                                conf = text_info[1]
                                lines.append(text)
                                page_conf_sum += conf
                                page_lines_count += 1
            
            page_text = "\n".join(lines)
            full_extracted_text.append(page_text)
            total_confidence += page_conf_sum
            total_lines += page_lines_count

        # Combine text from all pages
        final_text = "\n\n".join(filter(None, full_extracted_text)) # Separate pages by double newline
        avg_confidence = (total_confidence / total_lines) if total_lines > 0 else 0

        return {
            "success": True,
            "text": final_text,
            "confidence": avg_confidence,
            "lines": total_lines,
            "pages": len(images)
        }

    except Exception as e:
        logger.error(f"OCR Error: {str(e)}")
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
