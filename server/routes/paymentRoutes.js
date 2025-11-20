const express = require("express");
const router = express.Router();

const { 
  createOrder, 
  verifyPayment, 
  handlePaymentWebhook,
  getBillingHistory,
  toggleAutoRenewal,
  getAutoRenewalStatus
} = require("../controllers/paymentController");

const { generateInvoice } = require("../controllers/invoiceController");

const { verifyToken } = require("../middleware/authMiddleware");

// Protect payment routes with verifyToken
router.post("/create", verifyToken, createOrder);
router.post("/verify", verifyToken, verifyPayment);
router.post("/webhook", handlePaymentWebhook);
router.get("/history", verifyToken, getBillingHistory);
router.post("/auto-renewal/toggle", verifyToken, toggleAutoRenewal);
router.get("/auto-renewal/status", verifyToken, getAutoRenewalStatus);
router.get("/invoice/:transactionId", verifyToken, generateInvoice);

module.exports = router;