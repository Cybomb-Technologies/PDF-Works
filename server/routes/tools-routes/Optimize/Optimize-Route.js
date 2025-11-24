// server/routes/tools-routes/Optimize/Optimize-Route.js
const express = require("express");
const router = express.Router();
const optimizeController = require("../../../controllers/tool-controller/Optimize/Optimize-Controller");
const multer = require("multer");

// Auth middleware
const { verifyToken } = require("../../../middleware/authMiddleware");

// Multer configuration for Optimize routes
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 500 * 1024 * 1024,
    fields: 10,
    files: 1,
  }, 
  fileFilter: (req, file, cb) => {
    cb(null, true);
  }
});

// Apply multer middleware to file upload routes
router.post("/optimize-image", verifyToken, upload.single("files"), optimizeController.optimizeImage);
router.post("/minify-code", verifyToken, multer().none(), optimizeController.minifyCode);
router.post("/clean-cache", verifyToken, multer().none(), optimizeController.cleanCache);

// Download and History
router.get("/download/:filename", optimizeController.downloadOptimizedFile);
router.get("/history", verifyToken, optimizeController.getOptimizeHistory);

// Test route
router.get("/test", (req, res) => {
  res.json({ 
    success: true, 
    message: 'Optimize routes working',
    timestamp: new Date().toISOString(),
    routes: [
      'POST /optimize-image',
      'POST /minify-code',
      'POST /clean-cache',
      'GET /download/:filename',
      'GET /history'
    ]
  });
});

module.exports = router;