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

// ✅ Using memory storage like your previous working version
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 100 * 1024 * 1024, // 100MB limit (plan-specific limit checked in controller)
    files: 10 // Maximum 10 files
  },
  fileFilter: (req, file, cb) => {
    // Allow PDF files only for organize tools
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed for organize tools'), false);
    }
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
  res.json({ 
    success: true, 
    message: 'Organize routes working',
    timestamp: new Date().toISOString(),
    routes: [
      'POST /:tool (merge/split/rotate)',
      'GET /download/:filename',
      'GET /history'
    ]
  });
});

module.exports = router;