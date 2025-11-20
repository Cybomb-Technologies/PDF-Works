const express = require("express");
const router = express.Router();
const fileController = require("../controllers/fileController");
const { verifyToken } = require("../middleware/authMiddleware"); // Use your actual auth middleware

// Apply verifyToken middleware to all file routes
router.post("/save-converted", verifyToken, fileController.saveConvertedFile);
router.get("/", verifyToken, fileController.getUserFiles);
router.delete("/:id", verifyToken, fileController.deleteFile);

// Test route (optional - you can keep this public or protect it too)
router.get("/test", (req, res) => {
  res.json({ message: "File routes are working!" });
});

module.exports = router;
