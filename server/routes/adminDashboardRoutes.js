const express = require("express");
const router = express.Router();
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");
const {
  getPlans,
  getUsers,
  getFiles,
  getStats,
  getPayments,
  getPaymentStats,
  getPaymentById,
  updatePayment
} = require("../controllers/adminDashboardController");

// Apply admin middleware to all routes
router.use(verifyToken, verifyAdmin);

// Plan routes
router.get("/plans", getPlans);

// User routes
router.get("/users", getUsers);

// File routes
router.get("/files", getFiles);

// Stats routes
router.get("/stats", getStats);

// Payment routes
router.get("/payments", getPayments);
router.get("/payment-stats", getPaymentStats);
router.get("/payments/:id", getPaymentById);
router.patch("/payments/:id", updatePayment);

module.exports = router;