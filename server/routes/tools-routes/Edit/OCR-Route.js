const express = require("express");
const router = express.Router();
const multer = require("multer");
const OCRController = require("../../../controllers/tool-controller/Edit/OCR-Controller");

// Auth middleware
const { verifyToken } = require("../../../middleware/authMiddleware");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit for images
});

// OCR routes - PROTECTED WITH AUTH
router.post("/extract-text", upload.single("image"), OCRController.extractText);
router.post(
  "/save-ocr",
  verifyToken,
  upload.single("file"),
  OCRController.saveOCR
);

module.exports = router;
