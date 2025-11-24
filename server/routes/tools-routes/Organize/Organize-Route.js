// server/routes/tools-routes/Organize/Organize-Route.js
const express = require('express');
const multer = require('multer');

// Import all controller functions
const { 
  organizePDF, 
  downloadOrganizedFile, 
  getOrganizeHistory 
} = require('../../../controllers/tool-controller/Organize/Organize-Controller');

// Auth middleware
const { verifyToken } = require('../../../middleware/authMiddleware');

const router = express.Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 100 * 1024 * 1024, // 100MB limit
    files: 10 // Maximum 10 files
  } 
});

// Main organize endpoint - handles all operations
router.post('/:tool', verifyToken, upload.array('files', 10), organizePDF);

// Download organized file
router.get('/download/:filename', downloadOrganizedFile);

// Get organize history
router.get('/history', verifyToken, getOrganizeHistory);

// Test route
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Organize routes working' });
});

module.exports = router; 