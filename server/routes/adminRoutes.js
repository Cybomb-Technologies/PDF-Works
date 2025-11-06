// adminRoutes.js
const express = require("express");
const router = express.Router();
const { loginAdmin, getAllAdmins, getAdminById, updateAdmin, deleteAdmin } = require("../controllers/adminController");
const { verifyToken } = require("../middleware/authMiddleware");

// Admin login
router.post("/login", loginAdmin);

// Get all admins
router.get("/", verifyToken, getAllAdmins);

// Get admin by ID
router.get("/:id", verifyToken, getAdminById);

// Update admin
router.put("/update/:id", verifyToken, updateAdmin);

// Delete admin
router.delete("/delete/:id", verifyToken, deleteAdmin);

module.exports = router;