const express = require("express");
const router = express.Router();
const multer = require("multer");
const EditController = require("../../../controllers/tool-controller/Edit/Edit-Controller");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 },
});

// Routes
router.get("/test", (req, res) => res.json({ success: true, message: "Edit routes working" }));

router.post("/upload", upload.single("pdfFile"), EditController.uploadPDF);
router.get("/structure/:sessionId", EditController.getStructure);
router.post("/update-text", EditController.updateText);
router.post("/get-edits", EditController.getEdits);
router.post("/export", EditController.exportPDF);
router.post("/apply-edits", EditController.applyEdits);
router.get("/download/:sessionId", EditController.downloadEdited);

// Serve images
router.get("/background/:sessionId/page-:pageNum.png", EditController.serveBackgroundImage);
router.get("/images/:sessionId/page-:pageNum/:imageId", EditController.serveImage);

module.exports = router;
  