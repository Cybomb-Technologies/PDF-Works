const express = require("express");
const router = express.Router();
const {
  createContact,
  getAllContacts,
  exportContacts,
  downloadContactTemplate,
  importContacts,
} = require("../controllers/contactController");
const { verifyAdmin } = require("../middleware/authMiddleware");
const multer = require("multer");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "contact-import-" + uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Check file types
    const allowedTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error("Invalid file type. Only CSV and Excel files are allowed."),
        false
      );
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// POST new contact (public)
router.post("/", createContact);

// GET all contacts (admin only)
router.get("/", verifyAdmin, getAllContacts);

// Export contacts (admin only)
router.get("/export", verifyAdmin, exportContacts);

// Download template (admin only)
router.get("/template", verifyAdmin, downloadContactTemplate);

// Import contacts (admin only)
router.post("/import", verifyAdmin, upload.single("file"), importContacts);

module.exports = router;
