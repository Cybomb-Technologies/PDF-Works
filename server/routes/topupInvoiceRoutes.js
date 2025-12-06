const express = require("express");
const router = express.Router();
const { generateTopupInvoice } = require("../controllers/topupInvoiceController");
const { verifyToken } = require("../middleware/authMiddleware");

// Route to download topup invoice
router.get("/:transactionId", verifyToken, generateTopupInvoice);

module.exports = router;