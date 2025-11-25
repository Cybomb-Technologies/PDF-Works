// routes/fileRoutes.js - COMPLETE REPLACEMENT
const express = require("express");
const router = express.Router();
const fileController = require("../controllers/fileController");
const { verifyToken } = require("../middleware/authMiddleware");

// Apply verifyToken middleware to all file routes

// Get ALL files from ALL tools
router.get("/", verifyToken, fileController.getUserFiles);

// Download file from ANY tool
router.get("/download/:id", verifyToken, fileController.downloadFile);

// Download batch files (for file rename operations)
router.get("/download-batch/:batchId", verifyToken, fileController.downloadBatchFiles);

// Save converted file (convert tools only)
router.post("/save-converted", verifyToken, fileController.saveConvertedFile);

// Delete file from ANY tool
router.delete("/:id", verifyToken, fileController.deleteFile);

// Get file statistics
router.get("/stats", verifyToken, fileController.getFileStats);

// Test authentication
router.get("/test-auth", verifyToken, (req, res) => {
  res.json({ 
    success: true, 
    message: "Authentication is working",
    user: {
      id: req.user.id,
      email: req.user.email
    }
  });
});

// Test route
router.get("/test", (req, res) => {
  res.json({ 
    success: true, 
    message: "File routes are working! Now handles ALL tools.",
    endpoints: [
      'GET / - Get all files from all tools',
      'GET /download/:id - Download file from any tool',
      'GET /download-batch/:batchId - Download batch files',
      'POST /save-converted - Save converted files',
      'DELETE /:id - Delete file from any tool',
      'GET /stats - Get file statistics',
      'GET /test-auth - Test authentication'
    ]
  });
});

module.exports = router;