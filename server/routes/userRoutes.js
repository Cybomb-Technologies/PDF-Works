const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  getAllUsers,
  forgotPassword,
  resetPassword,
  exportUsers,
  downloadUserTemplate,
  importUsers,
} = require("../controllers/userController");
const { verifyAdmin } = require("../middleware/authMiddleware");
const multer = require("multer");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "user-import-" + uniqueSuffix + "-" + file.originalname);
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

// Public routes for user authentication
router.post("/register", registerUser);
router.post("/login", loginUser);

// Password reset routes
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Protected admin routes
router.get("/users", verifyAdmin, getAllUsers);
router.get("/users/export", verifyAdmin, exportUsers);
router.get("/users/template", verifyAdmin, downloadUserTemplate);
router.post("/users/import", verifyAdmin, upload.single("file"), importUsers);

module.exports = router;
