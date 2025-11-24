// server/routes/tools-routes/Security/Security-Routes.js
const express = require("express");
const router = express.Router();
const securityController = require("../../../controllers/tool-controller/Security/Security-Controller");
const multer = require("multer");

// Auth middleware
const { verifyToken } = require("../../../middleware/authMiddleware");

// Multer configuration for Security routes - FIXED VERSION
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
router.post("/encrypt", verifyToken, upload.single("files"), securityController.encryptFile);
router.post("/decrypt", verifyToken, upload.single("files"), securityController.decryptFile);
router.post("/protect-pdf-2fa", verifyToken, upload.single("files"), securityController.protectPDFWith2FA);
router.post("/share-file", verifyToken, upload.single("files"), securityController.shareFileWithAccess);

// Routes without file uploads - use multer.none() to parse form data
router.post("/access-pdf-2fa", verifyToken, multer().none(), securityController.access2FAProtectedPDF);
router.delete("/remove-2fa-file", verifyToken, multer().none(), securityController.remove2FAProtectedFile);
router.post("/add-user-access", verifyToken, multer().none(), securityController.addUserToFileAccess);
router.post("/access-shared-file", verifyToken, multer().none(), securityController.accessSharedFile);

// Routes without any form parsing
router.get("/list-2fa-files", verifyToken, securityController.list2FAProtectedFiles);
router.get("/file-access-list", verifyToken, securityController.getFileAccessList);
router.get("/list-shared-files", verifyToken, securityController.listSharedFiles);

// Download and History
router.get("/download/:filename", securityController.downloadSecurityFile);
router.get("/history", verifyToken, securityController.getSecurityHistory);

// Test route
router.get("/test", (req, res) => {
  res.json({ 
    success: true, 
    message: 'Security routes working',
    timestamp: new Date().toISOString(),
    routes: [
      'POST /encrypt',
      'POST /decrypt', 
      'POST /protect-pdf-2fa',
      'POST /access-pdf-2fa',
      'GET /list-2fa-files',
      'DELETE /remove-2fa-file',
      'POST /share-file',
      'POST /add-user-access',
      'POST /access-shared-file',
      'GET /file-access-list',
      'GET /list-shared-files',
      'GET /download/:filename',
      'GET /history'
    ]
  });
}); 

module.exports = router;