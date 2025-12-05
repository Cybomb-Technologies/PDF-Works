const express = require("express");
const router = express.Router();

const {
  healthCheck,
  createTopupOrder,
  verifyTopupPayment,
  handleTopupWebhook,
  getTopupHistory,
  getUserCredits,
} = require("../controllers/topupPaymentController");

const topupInvoiceRoutes = require("./topupInvoiceRoutes");

const { verifyToken } = require("../middleware/authMiddleware");

// ============================================
// 🔹 TEST ROUTE (No auth required)
// ============================================
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Topup API endpoint is working!",
    endpoint: "/api/payments/topup",
    timestamp: new Date().toISOString()
  });
});

// ============================================
// 🔹 HEALTH CHECK (With auth)
// ============================================
router.get("/health", verifyToken, healthCheck);

// ============================================
// 🔹 PAYMENT ROUTES (Protected)
// ============================================
router.post("/create-order", verifyToken, createTopupOrder);
router.post("/verify", verifyToken, verifyTopupPayment);

// ============================================
// 🔹 USER CREDIT ROUTES (Protected)
// ============================================
router.get("/history", verifyToken, getTopupHistory);
router.get("/credits", verifyToken, getUserCredits);

// ============================================
// 🔹 INVOICE ROUTES (Protected)
// ============================================
router.use("/invoice", topupInvoiceRoutes);

// ============================================
// 🔹 WEBHOOK (No Auth - Cashfree calls this)
// ============================================
router.post("/webhook", handleTopupWebhook);

module.exports = router;