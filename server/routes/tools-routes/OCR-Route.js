// routes/tool-routes/OCR-route.js - COMPLETE REPLACEMENT
const express = require("express");
const router = express.Router();
const multer = require("multer");
const OCRController = require("../../controllers/tool-controller/OCR-Controller");

// Auth middleware
const { verifyToken } = require("../../middleware/authMiddleware");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit for images
});

// OCR routes - PROTECTED WITH AUTH
router.post("/extract-text", verifyToken, upload.single("image"), OCRController.extractText);
router.post("/extract-batch", verifyToken, upload.array("images", 20), OCRController.extractBatchText);
router.post("/extract-handwriting", verifyToken, upload.single("image"), OCRController.extractHandwriting);
router.get("/download/:filename", OCRController.downloadOCRFile);
router.get("/preview/:filename", OCRController.previewOCRText);
router.get("/history", verifyToken, OCRController.getOCRHistory);

module.exports = router;