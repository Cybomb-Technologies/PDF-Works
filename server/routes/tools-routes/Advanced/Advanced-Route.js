// server/routes/tools-routes/Advanced/Advanced-Route.js
const express = require("express");
const router = express.Router();
const advancedController = require("../../../controllers/tool-controller/Advanced/Advanced-Controller");
const multer = require("multer");

// Auth middleware
const { verifyToken } = require("../../../middleware/authMiddleware");

// Multer configuration for Advanced routes
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 500 * 1024 * 1024,
    fields: 10,
  },
  fileFilter: (req, file, cb) => {
    cb(null, true);
  }
});

// Apply authentication middleware to all routes
router.post("/automation", verifyToken, multer().none(), advancedController.runAutomation);
router.post("/api-connect", verifyToken, multer().none(), advancedController.callApi);
router.get("/analytics", verifyToken, advancedController.getAnalytics);

// Download and History
router.get("/download/:filename", advancedController.downloadAdvancedFile);
router.get("/history", verifyToken, advancedController.getAdvancedHistory);

// Test route
router.get("/test", (req, res) => {
  res.json({ 
    success: true, 
    message: 'Advanced routes working',
    timestamp: new Date().toISOString(),
    routes: [
      'POST /automation',
      'POST /api-connect',
      'GET /analytics',
      'GET /download/:filename',
      'GET /history'
    ]
  });
}); 

module.exports = router;