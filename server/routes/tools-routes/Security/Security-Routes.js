const express = require("express");
const router = express.Router();
const securityController = require("../../../controllers/tool-controller/Security/Security-Controller");
const multer = require("multer");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 },
});

// Encryption / Decryption
router.post("/encrypt", upload.single("file"), securityController.encryptFile);
router.post("/decrypt", upload.single("file"), securityController.decryptFile);

// 2FA
router.post("/protect-pdf-2fa", upload.single("file"), securityController.protectPDFWith2FA);
router.post("/access-pdf-2fa", securityController.access2FAProtectedPDF);
router.get("/list-2fa-files", securityController.list2FAProtectedFiles);
router.delete("/remove-2fa-file", securityController.remove2FAProtectedFile);

// File Sharing
router.post("/share-file", upload.single("file"), securityController.shareFileWithAccess);
router.post("/add-user-access", securityController.addUserToFileAccess);
router.post("/access-shared-file", securityController.accessSharedFile);
router.get("/file-access-list", securityController.getFileAccessList);
router.get("/list-shared-files", securityController.listSharedFiles);

module.exports = router;
