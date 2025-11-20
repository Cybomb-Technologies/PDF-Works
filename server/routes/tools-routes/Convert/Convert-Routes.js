// Convert-Routes.js (FINAL FIXED VERSION)
const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");

// Auth middleware
const {
  verifyToken,
  optionalAuth,
} = require("../../../middleware/authMiddleware");

// Controllers
const {
  convertToPdf,
  convertPdfToImage,
  convertImageToPdf,
  downloadConvertedFile,
  getConversionStatus,
  testLimits // ADD THIS
} = require("../../../controllers/tool-controller/Convert/Convert-Controller");

// -------------------------------------------------------
// DEFINE ROOT DIRECTORY (IMPORTANT FIX)
// Ensures all tools use: server/uploads/
// -------------------------------------------------------
const ROOT_DIR = path.join(__dirname, "../../../"); 

// -------------------------------------------------------
// MULTER CONFIG (250MB upload limit)
// Files stored in /uploads/temp
// -------------------------------------------------------

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(ROOT_DIR, "uploads/temp"));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 250 * 1024 * 1024 }, // 250MB
});

// -------------------------------------------------------
// ROUTES
// -------------------------------------------------------

// ⭐ Convert Word/Excel/PPT/Image → PDF
router.post(
  "/to-pdf",
  verifyToken,
  upload.single("file"),
  convertToPdf
);

// ⭐ Convert PDF → Image
router.post(
  "/pdf-to-image",
  verifyToken,
  upload.single("file"),
  convertPdfToImage
);

// ⭐ Convert Image → PDF
router.post(
  "/image-to-pdf",
  verifyToken,
  upload.single("file"),
  convertImageToPdf
);

// ⭐ Download converted file
router.get("/download/:conversionId", optionalAuth, downloadConvertedFile);

// ⭐ Check conversion status
router.get("/status/:conversionId", optionalAuth, getConversionStatus);

// ⭐ TEST LIMITS - ADD THIS ROUTE
router.get("/test-limits", verifyToken, testLimits);

// -------------------------------------------------------
module.exports = router;