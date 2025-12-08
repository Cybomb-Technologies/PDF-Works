const axios = require("axios");
const TopupPackage = require("../models/TopupPackage");
const TopupPayment = require("../models/TopupPayment");
const User = require("../models/UserModel");
require("dotenv").config();

// IMPORT TOPUP INVOICE FUNCTION
const { sendTopupInvoiceAfterPayment } = require("../controllers/topupInvoiceController");

const CASHFREE_BASE_URL = process.env.CASHFREE_BASE_URL || "https://sandbox.cashfree.com/pg/orders";
const EXCHANGE_RATE = process.env.EXCHANGE_RATE ? Number(process.env.EXCHANGE_RATE) : 83.5;

// ============================================
// 🔹 HEALTH CHECK ENDPOINT (For Testing)
// ============================================
const healthCheck = async (req, res) => {
 // console.log("✅ Topup Health Check Called");
  res.json({
    success: true,
    message: "Topup Payment API is working!",
    timestamp: new Date().toISOString(),
    user: req.user ? {
      id: req.user.id,
      email: req.user.email
    } : null,
    endpoint: "/api/payments/topup"
  });
};

// ============================================
// 🔹 CREATE TOPUP ORDER
// ============================================
const createTopupOrder = async (req, res) => {
  // console.log("🔹 CREATE TOPUP ORDER - Request received");
  // console.log("📝 Request body:", req.body);
  // console.log("👤 User from request:", req.user);

  try {
    const { topupPackageId, currency = "USD" } = req.body;

    // Validate authentication
    if (!req.user || !req.user.id) {
      console.error("❌ User not authenticated");
      return res.status(401).json({
        success: false,
        message: "User not authenticated. Please login again.",
      });
    }

    const userId = req.user.id;
   // console.log("👤 User ID:", userId);

    if (!topupPackageId) {
      console.error("❌ Missing topupPackageId");
      return res.status(400).json({
        success: false,
        message: "Topup package is required",
      });
    }

    // Get user details
    const user = await User.findById(userId).select("email planName name phone topupCredits");
    if (!user) {
      console.error("❌ User not found in database");
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

   // console.log("✅ User found:", user.email);

    // Get topup package
    const topupPackage = await TopupPackage.findById(topupPackageId);
    if (!topupPackage) {
      console.error("❌ Topup package not found:", topupPackageId);
      return res.status(404).json({
        success: false,
        message: "Topup package not found",
      });
    }

    if (!topupPackage.isActive) {
      console.error("❌ Topup package inactive");
      return res.status(400).json({
        success: false,
        message: "This topup package is not currently available",
      });
    }

   // console.log("✅ Topup package:", topupPackage.name, "Price:", topupPackage.price);

    // Calculate amount
    let amount = topupPackage.price;
    let orderCurrency = currency;

    // Convert to INR if needed
    if (currency === "INR") {
      amount = Math.round(amount * EXCHANGE_RATE);
      orderCurrency = "INR";
    }

    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      console.error("❌ Invalid amount:", amount);
      return res.status(400).json({
        success: false,
        message: "Invalid package pricing",
      });
    }

    // Generate unique order ID
    const orderId = `TOPUP_${Date.now()}_${userId}`;
   // console.log("📦 Generated Order ID:", orderId);

    // Get user's current credits snapshot
    const creditsBefore = {
      conversion: user.topupCredits?.conversion || 0,
      editTools: user.topupCredits?.editTools || 0,
      organizeTools: user.topupCredits?.organizeTools || 0,
      securityTools: user.topupCredits?.securityTools || 0,
      optimizeTools: user.topupCredits?.optimizeTools || 0,
      advancedTools: user.topupCredits?.advancedTools || 0,
      convertTools: user.topupCredits?.convertTools || 0,
      total: user.topupCredits?.total || 0,
    };

    // Create payment record FIRST (before calling Cashfree)
    const paymentRecord = new TopupPayment({
      userId,
      topupPackageId,
      amount,
      currency: orderCurrency,
      status: "pending",
      transactionId: orderId,
      creditsAllocated: {
        conversion: topupPackage.conversionCredits,
        editTools: topupPackage.editToolsCredits,
        organizeTools: topupPackage.organizeToolsCredits,
        securityTools: topupPackage.securityToolsCredits,
        optimizeTools: topupPackage.optimizeToolsCredits,
        advancedTools: topupPackage.advancedToolsCredits,
        convertTools: topupPackage.convertToolsCredits,
        total: topupPackage.totalCredits,
      },
      userSnapshot: {
        email: user.email,
        plan: user.planName || "free",
        creditsBefore,
      },
    });

    await paymentRecord.save();
   // console.log("✅ Payment record saved:", orderId);

    // Create Cashfree order payload
    const orderPayload = {
      order_id: orderId,
      order_amount: amount,
      order_currency: orderCurrency,
      customer_details: {
        customer_id: userId.toString(),
        customer_name: user.name || "Customer",
        customer_email: user.email || "customer@example.com",
        customer_phone: user.phone || "9999999999",
      },
      order_note: `Top-up Credits: ${topupPackage.name}`,
      order_meta: {
        return_url: `${process.env.CLIENT_URL || "http://localhost:3000"}/payment/topup-result?order_id={order_id}`,
        notify_url: `${process.env.API_URL || "http://localhost:5000"}/api/payments/topup/webhook`,
      },
    };

    // console.log("📤 Calling Cashfree API...");
    // console.log("🔑 Cashfree URL:", CASHFREE_BASE_URL);

    // Call Cashfree API - USE 2022-01-01 API VERSION (SAME AS SUBSCRIPTION)
    let response;
    try {
      response = await axios.post(CASHFREE_BASE_URL, orderPayload, {
        headers: {
          "x-client-id": process.env.CASHFREE_APP_ID,
          "x-client-secret": process.env.CASHFREE_SECRET_KEY,
          "x-api-version": "2022-01-01", // CHANGED FROM 2022-09-01 to 2022-01-01
          "Content-Type": "application/json",
        },
        timeout: 10000,
      });
     // console.log("✅ Cashfree response received");
      
    } catch (axiosError) {
      console.error("❌ Cashfree API Error:");
      console.error("Status:", axiosError.response?.status);
      console.error("Data:", axiosError.response?.data);
      console.error("Message:", axiosError.message);
      
      // Update payment record to failed
      paymentRecord.status = "failed";
      await paymentRecord.save();
      
      throw new Error(`Payment gateway error: ${axiosError.response?.data?.message || axiosError.message}`);
    }

    // Update payment record with Cashfree order ID
    paymentRecord.cashfreeOrderId = response.data.order_id || orderId;
    await paymentRecord.save();

    // console.log("✅ Cashfree order created successfully");
    
    // Extract payment link - Check for payment_link field (same as subscription)
    let paymentLink = response.data.payment_link;
    
  
    
    // console.log("🔗 Final payment link:", paymentLink);
    
    // Return success response
    return res.json({
      success: true,
      paymentLink: paymentLink,
      orderId: response.data.order_id || orderId,
      paymentSessionId: response.data.payment_session_id,
      amount,
      currency: orderCurrency,
      topupPackage: {
        id: topupPackage._id,
        name: topupPackage.name,
        credits: topupPackage.totalCredits,
      },
    });

  } catch (err) {
    console.error("❌ CREATE TOPUP ORDER ERROR:");
    console.error("Error name:", err.name);
    console.error("Error message:", err.message);
    console.error("Error stack:", err.stack);
    
    // Handle specific errors
    let errorMessage = "Failed to create topup order";
    let statusCode = 500;
    
    if (err.response?.data?.message) {
      errorMessage = err.response.data.message;
    } else if (err.message.includes("ECONNREFUSED")) {
      errorMessage = "Payment service temporarily unavailable. Please try again in a moment.";
    } else if (err.message.includes("timeout")) {
      errorMessage = "Payment request timed out. Please try again.";
    } else if (err.message.includes("Payment gateway error")) {
      errorMessage = err.message;
    }

    return res.status(statusCode).json({
      success: false,
      message: errorMessage,
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// ============================================
// 🔹 VERIFY TOPUP PAYMENT (Frontend Callback)
// ============================================
const verifyTopupPayment = async (req, res) => {
  // console.log("🔹 VERIFY TOPUP PAYMENT - Request received");
  // console.log("📝 Request body:", req.body);

  try {
    const { orderId } = req.body;

    // Validate authentication
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated. Please login again.",
      });
    }

    const userId = req.user.id;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

   // console.log("🔍 Looking for payment record:", orderId, "for user:", userId);

    // Get payment record
    const paymentRecord = await TopupPayment.findOne({
      transactionId: orderId,
      userId,
    });

    if (!paymentRecord) {
      console.error("❌ Payment record not found");
      return res.status(404).json({
        success: false,
        message: "Payment record not found",
      });
    }

    // console.log("✅ Payment record found, status:", paymentRecord.status);

    // If already successful, return success
    if (paymentRecord.status === "success") {
      const user = await User.findById(userId).select("topupCredits");
      
      return res.json({
        success: true,
        message: "Payment already verified and credits added successfully!",
        orderStatus: "PAID",
        creditsAdded: paymentRecord.creditsAllocated,
        currentCredits: user?.topupCredits || {},
        alreadyProcessed: true,
      });
    }

    // console.log("🔍 Verifying with Cashfree...");
    
    // Verify with Cashfree - USE 2022-01-01 API VERSION
    let response;
    try {
      response = await axios.get(`${CASHFREE_BASE_URL}/${orderId}`, {
        headers: {
          "x-client-id": process.env.CASHFREE_APP_ID,
          "x-client-secret": process.env.CASHFREE_SECRET_KEY,
          "x-api-version": "2022-01-01", // CHANGED FROM 2022-09-01 to 2022-01-01
        },
      });
    } catch (verifyError) {
      console.error("❌ Cashfree verification error:", verifyError.message);
      // Check if payment was already processed via webhook
      const updatedRecord = await TopupPayment.findOne({ transactionId: orderId });
      if (updatedRecord && updatedRecord.status === "success") {
        return res.json({
          success: true,
          message: "Payment already processed via webhook",
          orderStatus: "PAID",
          alreadyProcessed: true,
        });
      }
      throw verifyError;
    }

    const data = response.data;
    // console.log("✅ Cashfree verification response:", {
    //   order_status: data.order_status,
    //   order_amount: data.order_amount,
    // });

    // Handle successful payment
    if (data.order_status === "PAID") {
      // Update payment record
      paymentRecord.status = "success";
      paymentRecord.paymentMethod = data.payment_method || "card";
      paymentRecord.paidAt = new Date();
      await paymentRecord.save();

      // Get user to add credits
      const user = await User.findById(userId);
      if (!user) {
        console.error("❌ User not found during verification:", userId);
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Initialize topupCredits if not exists
      if (!user.topupCredits) {
        user.topupCredits = {
          conversion: 0,
          editTools: 0,
          organizeTools: 0,
          securityTools: 0,
          optimizeTools: 0,
          advancedTools: 0,
          convertTools: 0,
          total: 0,
        };
      }

      // Add credits from package - FIXED: Match UserModel structure
      const credits = paymentRecord.creditsAllocated;

      user.topupCredits.conversion += credits.conversion || 0;
      user.topupCredits.editTools += credits.editTools || 0;
      user.topupCredits.organizeTools += credits.organizeTools || 0;
      user.topupCredits.securityTools += credits.securityTools || 0;
      user.topupCredits.optimizeTools += credits.optimizeTools || 0;
      user.topupCredits.advancedTools += credits.advancedTools || 0;
      user.topupCredits.convertTools += credits.convertTools || 0;

      // Calculate total - FIXED: Match UserModel pre-save hook
      user.topupCredits.total = 
        user.topupCredits.conversion +
        user.topupCredits.editTools +
        user.topupCredits.organizeTools +
        user.topupCredits.securityTools +
        user.topupCredits.optimizeTools +
        user.topupCredits.advancedTools +
        user.topupCredits.convertTools;

      // Initialize topupPurchases array if not exists
      if (!user.topupPurchases) {
        user.topupPurchases = [];
      }

      // Add purchase to history - FIXED: Match UserModel structure exactly
      user.topupPurchases.push({
        packageId: paymentRecord.topupPackageId,
        creditsAdded: {
          conversion: credits.conversion || 0,
          editTools: credits.editTools || 0,
          organizeTools: credits.organizeTools || 0,
          securityTools: credits.securityTools || 0,
          optimizeTools: credits.optimizeTools || 0,
          advancedTools: credits.advancedTools || 0,
          convertTools: credits.convertTools || 0,
          total: credits.total || 0
        },
        purchaseDate: new Date(),
        transactionId: paymentRecord.transactionId,
        amount: paymentRecord.amount,
        currency: paymentRecord.currency,
      });

      // Save user with updated credits
      await user.save();

      // console.log(`✅ Credits added to user ${user.email}`);
      // console.log(`📊 New credits - Total: ${user.topupCredits.total}`);
      // console.log(`📊 Purchase history count: ${user.topupPurchases.length}`);

      // ✅ AUTO SEND TOPUP INVOICE (fire-and-forget)
      sendTopupInvoiceAfterPayment(orderId, userId).catch((err) =>
        console.error("Failed to send topup invoice email (verifyPayment):", err)
      );

      return res.json({
        success: true,
        message: "Payment verified and credits added successfully!",
        orderStatus: data.order_status,
        orderAmount: data.order_amount,
        orderCurrency: data.order_currency,
        creditsAdded: credits,
        currentCredits: user.topupCredits,
        topupPackage: {
          id: paymentRecord.topupPackageId,
          name: paymentRecord.creditsAllocated.total + " credits",
        },
        invoiceGenerated: true,
      });

    } else {
      // Payment failed or pending
      paymentRecord.status = "failed";
      paymentRecord.paymentMethod = data.payment_method || "unknown";
      await paymentRecord.save();

      return res.json({
        success: false,
        message: "Payment not completed yet",
        orderStatus: data.order_status,
        retryUrl: `/topup`,
      });
    }

  } catch (err) {
    console.error("❌ VERIFY TOPUP PAYMENT ERROR:");
    console.error("Error:", err.message);
    
    return res.status(500).json({
      success: false,
      message: "Failed to verify payment. Please try again or contact support.",
    });
  }
};

// ============================================
// 🔹 WEBHOOK HANDLER (Cashfree → Server)
// ============================================
const handleTopupWebhook = async (req, res) => {
 // console.log("🔔 TOPUP WEBHOOK RECEIVED");

  try {
    const { data, event } = req.body;

    // Only process successful payments
    if (event === "PAYMENT_SUCCESS_WEBHOOK") {
      const { orderId } = data;

      if (!orderId) {
        console.error("❌ No orderId in webhook data");
        return res.status(400).json({ success: false, message: "No orderId" });
      }

     // console.log(`🔍 Processing webhook for order: ${orderId}`);

      // Find payment record
      const paymentRecord = await TopupPayment.findOne({
        transactionId: orderId,
        status: "pending",
      });

      if (!paymentRecord) {
       // console.log(`⚠️ Payment record not found or already processed: ${orderId}`);
        return res.status(200).json({ success: true });
      }

     // console.log(`✅ Found payment record for user: ${paymentRecord.userId}`);

      // Update payment record
      paymentRecord.status = "success";
      paymentRecord.paymentMethod = data.payment?.payment_method || "card";
      paymentRecord.paidAt = new Date();
      await paymentRecord.save();

      // Get user to add credits
      const user = await User.findById(paymentRecord.userId);
      if (!user) {
        console.error(`❌ User not found: ${paymentRecord.userId}`);
        return res.status(200).json({ success: true });
      }

      // Initialize topupCredits if not exists
      if (!user.topupCredits) {
        user.topupCredits = {
          conversion: 0,
          editTools: 0,
          organizeTools: 0,
          securityTools: 0,
          optimizeTools: 0,
          advancedTools: 0,
          convertTools: 0,
          total: 0,
        };
      }

      // Add credits from package
      const credits = paymentRecord.creditsAllocated;

      user.topupCredits.conversion += credits.conversion || 0;
      user.topupCredits.editTools += credits.editTools || 0;
      user.topupCredits.organizeTools += credits.organizeTools || 0;
      user.topupCredits.securityTools += credits.securityTools || 0;
      user.topupCredits.optimizeTools += credits.optimizeTools || 0;
      user.topupCredits.advancedTools += credits.advancedTools || 0;
      user.topupCredits.convertTools += credits.convertTools || 0;

      // Calculate total
      user.topupCredits.total = 
        user.topupCredits.conversion +
        user.topupCredits.editTools +
        user.topupCredits.organizeTools +
        user.topupCredits.securityTools +
        user.topupCredits.optimizeTools +
        user.topupCredits.advancedTools +
        user.topupCredits.convertTools;

      // Initialize topupPurchases array if not exists
      if (!user.topupPurchases) {
        user.topupPurchases = [];
      }

      // Add purchase to history - FIXED: Match UserModel structure
      user.topupPurchases.push({
        packageId: paymentRecord.topupPackageId,
        creditsAdded: {
          conversion: credits.conversion || 0,
          editTools: credits.editTools || 0,
          organizeTools: credits.organizeTools || 0,
          securityTools: credits.securityTools || 0,
          optimizeTools: credits.optimizeTools || 0,
          advancedTools: credits.advancedTools || 0,
          convertTools: credits.convertTools || 0,
          total: credits.total || 0
        },
        purchaseDate: new Date(),
        transactionId: paymentRecord.transactionId,
        amount: paymentRecord.amount,
        currency: paymentRecord.currency,
      });

      // Save user with updated credits
      await user.save();

      // console.log(`✅ Webhook: Credits added to user ${user.email}`);
      // console.log(`📊 New total credits: ${user.topupCredits.total}`);

      // ✅ AUTO SEND TOPUP INVOICE (fire-and-forget)
      sendTopupInvoiceAfterPayment(orderId, paymentRecord.userId).catch((err) =>
        console.error("Failed to send topup invoice email (webhook):", err)
      );
    }

    // ALWAYS return 200 to Cashfree
    res.status(200).json({ success: true });

  } catch (error) {
    console.error("❌ WEBHOOK PROCESSING ERROR:", error);
    res.status(200).json({ success: true });
  }
};

// ============================================
// 🔹 GET USER'S TOPUP HISTORY
// ============================================
const getTopupHistory = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const userId = req.user.id;

    const payments = await TopupPayment.find({
      userId,
      status: { $in: ["success", "failed", "pending"] },
    })
      .populate("topupPackageId", "name description totalCredits icon")
      .sort({ createdAt: -1 })
      .limit(20)
      .select(
        "transactionId amount currency status creditsAllocated paidAt createdAt paymentMethod"
      );

    const user = await User.findById(userId).select("topupCredits");
    
    return res.json({
      success: true,
      payments,
      currentCredits: user?.topupCredits || {},
    });

  } catch (err) {
    console.error("Get Topup History Error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to get topup history",
    });
  }
};

// ============================================
// 🔹 GET USER'S CURRENT CREDITS
// ============================================
const getUserCredits = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const userId = req.user.id;
    const user = await User.findById(userId).select("topupCredits topupPurchases planName");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Default credits if not set
    const credits = user.topupCredits || {
      conversion: 0,
      editTools: 0,
      organizeTools: 0,
      securityTools: 0,
      optimizeTools: 0,
      advancedTools: 0,
      convertTools: 0,
      total: 0,
    };

    // Calculate total purchases
    const totalPurchased = user.topupPurchases?.reduce((sum, purchase) => {
      return sum + (purchase.creditsAdded?.total || 0);
    }, 0) || 0;

    return res.json({
      success: true,
      credits,
      totalPurchased,
      purchaseCount: user.topupPurchases?.length || 0,
      plan: user.planName,
    });

  } catch (err) {
    console.error("Get User Credits Error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to get user credits",
    });
  }
};

module.exports = {
  healthCheck,
  createTopupOrder,
  verifyTopupPayment,
  handleTopupWebhook,
  getTopupHistory,
  getUserCredits,
};