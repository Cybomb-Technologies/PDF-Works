const express = require("express");
const router = express.Router();
const { verifyToken } = require("../../middleware/authMiddleware");
const {
  getAllActivities,
  downloadActivityFile,
  getActivityStats
} = require("../../controllers/activities/activities-Controller");

// Unified activities endpoint
router.get("/", verifyToken, getAllActivities);

// Download any file by tool type and filename
router.get("/download/:tool/:filename", verifyToken, downloadActivityFile);

// Get activity statistics
router.get("/stats", verifyToken, getActivityStats);

module.exports = router;