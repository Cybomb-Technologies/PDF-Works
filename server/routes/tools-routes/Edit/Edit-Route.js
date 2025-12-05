// server/routes/tools-routes/Edit/Edit-Route.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const EditController = require("../../../controllers/tool-controller/Edit/Edit-Controller");

// Auth middleware
const { verifyToken } = require("../../../middleware/authMiddleware");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 },
});

// Routes
router.get("/test", (req, res) =>
  res.json({ success: true, message: "Edit routes working" })
);

// PDF Editor routes - ALL PROTECTED WITH AUTH
router.post(
  "/upload",
  verifyToken,
  upload.single("pdfFile"),
  EditController.uploadPDF
);
router.get("/structure/:sessionId", verifyToken, EditController.getStructure);
router.post("/update-text", verifyToken, EditController.updateText);
router.post("/get-edits", verifyToken, EditController.getEdits);
router.post("/export", verifyToken, EditController.exportPDF);
router.post("/apply-edits", verifyToken, EditController.applyEdits);
router.get("/download/:sessionId", verifyToken, EditController.downloadEdited);

// Serve images
router.get(
  "/background/:sessionId/page-:pageNum.png",
  EditController.serveBackgroundImage
);
router.get(
  "/images/:sessionId/page-:pageNum/:imageId",
  EditController.serveImage
);

// Edit model routes - ALL PROTECTED WITH AUTH
router.post(
  "/save-pdf-edit",
  verifyToken,
  upload.single("file"),
  EditController.savePdfEdit
);
router.post(
  "/save-image-crop",
  verifyToken,
  upload.single("file"),
  EditController.saveImageCrop
);

// File rename with batch support - PROTECTED WITH AUTH
router.post(
  "/save-file-rename",
  verifyToken,
  upload.array("files", 10),
  EditController.saveFileRename
);

// Batch download route - PROTECTED WITH AUTH
router.get(
  "/download-batch/:batchId",
  verifyToken,
  EditController.downloadBatch
);

router.get("/download-edited/:filename", EditController.downloadEditedFile);
router.get("/history", verifyToken, EditController.getEditHistory);

module.exports = router;