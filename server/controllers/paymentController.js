const axios = require("axios");
const PricingPlan = require("../models/Pricing");
const User = require("../models/UserModel");
const Payment = require("../models/Payment");
const { sendInvoiceAfterPayment } = require("./invoiceController");
require("dotenv").config();

const CASHFREE_BASE_URL =
  process.env.CASHFREE_BASE_URL || "https://sandbox.cashfree.com/pg/orders";
const EXCHANGE_RATE = process.env.EXCHANGE_RATE
  ? Number(process.env.EXCHANGE_RATE)
  : 83.5;

// Helper function to calculate expiry date
const calculateExpiryDate = (billingCycle) => {
  const now = new Date();
  if (billingCycle === "annual") {
    return new Date(now.setFullYear(now.getFullYear() + 1));
  } else {
    return new Date(now.setMonth(now.getMonth() + 1));
  }
};

// Calculate amount based on plan and billing cycle - FIXED VERSION
const calculateAmountFromPlan = async (planId, billingCycle, currency) => {
  const plan = await PricingPlan.findById(planId);

  if (!plan) {
    throw new Error("Invalid plan selected");
  }

  console.log("Plan data:", {
    planId: plan._id,
    name: plan.name,
    usdPrice: plan.usdPrice,
    billingCycles: plan.billingCycles,
  });

  let amount;
  let finalCurrency = currency;

  // FIX: Use billingCycles data for both USD and INR
  if (billingCycle === "annual") {
    amount = plan.billingCycles?.annual;
  } else {
    amount = plan.billingCycles?.monthly;
  }

  // FIX: If billingCycles doesn't exist, fallback to reasonable defaults
  if (amount === undefined || amount === null) {
    console.warn("Using fallback pricing for plan:", plan.name);
    if (billingCycle === "annual") {
      amount = 90; // Default annual price
    } else {
      amount = 10; // Default monthly price
    }
  }

  // FIX: Ensure amount is a valid number
  if (isNaN(amount) || amount === null || amount === undefined) {
    console.error("Invalid amount calculated:", amount);
    throw new Error("Invalid plan pricing");
  }

  // Convert to number and round
  amount = Number(amount);

  // Convert to INR if needed
  if (currency === "INR") {
    amount = Math.round(amount * EXCHANGE_RATE);
    finalCurrency = "INR";
  }

  console.log("Final calculated amount:", {
    originalAmount: plan.billingCycles?.[billingCycle],
    convertedAmount: amount,
    currency: finalCurrency,
    exchangeRate: currency === "INR" ? EXCHANGE_RATE : "N/A",
  });

  return { amount, currency: finalCurrency, plan };
};

// ✅ APPROACH 2: Simple Upgrade - Keep current usage, just increase limits
const handleSimpleUpgrade = async (userId, newPlanId) => {
  try {
    const user = await User.findById(userId);
    const newPlan = await PricingPlan.findById(newPlanId);

    if (!user || !newPlan) {
      throw new Error("User or plan not found");
    }

    console.log(
      "🔄 Simple upgrade - keeping current usage, updating plan only"
    );
    console.log("Before upgrade:", {
      userId: user._id,
      oldPlan: user.planName,
      newPlan: newPlan.name,
      currentUsage: user.usage,
    });

    // Update user plan - usage object remains exactly the same
    user.plan = newPlanId;
    user.planName = newPlan.name;
    user.subscriptionStatus = "active";
    user.planExpiry = calculateExpiryDate(user.billingCycle);
    user.autoRenewal = true;

    // ✅ USAGE REMAINS UNCHANGED - only plan limits increase
    await user.save();

    console.log("After upgrade:", {
      userId: user._id,
      newPlan: user.planName,
      usageRemains: user.usage,
    });

    return user;
  } catch (error) {
    console.error("Error in simple upgrade:", error);
    throw error;
  }
};

// Create Order
const createOrder = async (req, res) => {
  try {
    const { planId, billingCycle = "monthly", currency = "USD" } = req.body;

    console.log("Payment request received:", { planId, billingCycle, currency });
    console.log("User from request:", req.user);

    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      console.error("User not authenticated - no user in request");
      return res.status(401).json({
        success: false,
        message: "User not authenticated. Please login again.",
      });
    }

    const userId = req.user.id;

    if (!planId) {
      return res.status(400).json({
        success: false,
        message: "Plan is required",
      });
    }

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    console.log("Found user:", user.email);

    // Calculate amount and get plan
    const { amount, currency: orderCurrency, plan } =
      await calculateAmountFromPlan(planId, billingCycle, currency);

    if (!plan) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan selected",
      });
    }

    // FIX: Validate amount is a valid number
    if (isNaN(amount) || amount <= 0) {
      console.error("Invalid amount:", amount);
      return res.status(400).json({
        success: false,
        message: "Invalid plan pricing. Please contact support.",
      });
    }

    const orderId = `ORDER_${Date.now()}_${userId}`;

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
      order_note: `Plan: ${plan.name}, Billing: ${billingCycle}, Currency: ${orderCurrency}`,
      order_meta: {
        return_url: `${
          process.env.CLIENT_URL || "http://localhost:3000"
        }/payment/result?order_id={order_id}`,
        notify_url: `${
          process.env.API_URL || "http://localhost:5000"
        }/api/payments/webhook`,
      },
    };

    console.log("Creating Cashfree order with payload:", {
      order_id: orderPayload.order_id,
      order_amount: orderPayload.order_amount,
      order_currency: orderPayload.order_currency,
      customer_email: orderPayload.customer_details.customer_email,
    });

    const response = await axios.post(CASHFREE_BASE_URL, orderPayload, {
      headers: {
        "x-client-id": process.env.CASHFREE_APP_ID,
        "x-client-secret": process.env.CASHFREE_SECRET_KEY,
        "x-api-version": "2022-01-01",
        "Content-Type": "application/json",
      },
    });

    // Create payment record
    const paymentRecord = new Payment({
      userId,
      amount,
      currency: orderCurrency,
      status: "pending",
      transactionId: orderId,
      expiryDate: calculateExpiryDate(billingCycle),
      planId: plan._id,
      planName: plan.name,
      billingCycle,
      autoRenewal: true,
      renewalStatus: "scheduled",
      nextRenewalDate: calculateExpiryDate(billingCycle),
    });

    await paymentRecord.save();

    console.log("Payment record created successfully");

    return res.json({
      success: true,
      paymentLink: response.data.payment_link,
      orderId: response.data.order_id || orderId,
      paymentSessionId: response.data.payment_session_id,
      amount,
      currency: orderCurrency,
      planId: plan._id,
      billingCycle,
    });
  } catch (err) {
    console.error(
      "Cashfree Create Order Error:",
      err.response?.data || err.message
    );
    return res.status(500).json({
      success: false,
      message:
        err.response?.data?.message ||
        err.message ||
        "Failed to create order",
    });
  }
};

// Verify Payment - UPDATED WITH SIMPLE UPGRADE + INVOICE EMAIL
const verifyPayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    // Check user authentication properly
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

    console.log("Verifying payment for order:", orderId);

    const response = await axios.get(`${CASHFREE_BASE_URL}/${orderId}`, {
      headers: {
        "x-client-id": process.env.CASHFREE_APP_ID,
        "x-client-secret": process.env.CASHFREE_SECRET_KEY,
        "x-api-version": "2022-01-01",
      },
    });

    const data = response.data;

    if (data.order_status === "PAID") {
      // Find the payment record
      const paymentRecord = await Payment.findOne({ transactionId: orderId });

      if (paymentRecord) {
        const userBefore = await User.findById(userId);

        // Update payment status with additional details from Cashfree
        paymentRecord.status = "success";
        paymentRecord.renewalStatus = "scheduled";
        paymentRecord.nextRenewalDate = paymentRecord.expiryDate;
        paymentRecord.paymentMethod = data.payment_method || "card";
        paymentRecord.paidAt = new Date();

        await paymentRecord.save();

        // ✅ SIMPLE UPGRADE: Keep current usage, update plan only
        await handleSimpleUpgrade(userId, paymentRecord.planId);

        // Get updated user to verify changes
        const userAfter = await User.findById(userId);

        console.log("✅ Upgrade completed successfully:");
        console.log("User before:", {
          plan: userBefore.planName,
          usage: userBefore.usage,
        });
        console.log("User after:", {
          plan: userAfter.planName,
          usage: userAfter.usage,
        });

        // ✅ AUTO SEND INVOICE (fire-and-forget)
        sendInvoiceAfterPayment(orderId, userId).catch((err) =>
          console.error("Failed to send invoice email (verifyPayment):", err)
        );

        return res.status(200).json({
          success: true,
          message:
            "Payment verified and plan upgraded successfully! Your usage limits have been increased while keeping your current progress.",
          orderStatus: data.order_status,
          orderAmount: data.order_amount,
          orderCurrency: data.order_currency,
          planId: paymentRecord.planId,
          planName: paymentRecord.planName,
          billingCycle: paymentRecord.billingCycle,
          upgradeType: "simple", // Indicate this was a simple upgrade
          usagePreserved: true, // Let frontend know usage was kept
        });
      }
    } else {
      // Update payment status to failed if not paid
      await Payment.findOneAndUpdate(
        { transactionId: orderId },
        {
          status: "failed",
          paymentMethod: data.payment_method || "unknown",
        }
      );

      return res.status(200).json({
        success: false,
        message: "Payment not completed yet",
        orderStatus: data.order_status,
      });
    }
  } catch (err) {
    console.error(
      "Cashfree Verify Payment Error:",
      err.response?.data || err.message
    );
    return res.status(500).json({
      success: false,
      message: "Failed to verify payment",
    });
  }
};

// Webhook handler - UPDATED WITH SIMPLE UPGRADE + INVOICE EMAIL
const handlePaymentWebhook = async (req, res) => {
  try {
    const { data, event } = req.body;

    if (event === "PAYMENT_SUCCESS_WEBHOOK") {
      const { orderId } = data;

      console.log("Payment webhook received:", { orderId });

      // Update payment record
      const paymentRecord = await Payment.findOne({ transactionId: orderId });
      if (paymentRecord) {
        paymentRecord.status = "success";
        paymentRecord.renewalStatus = "scheduled";
        paymentRecord.nextRenewalDate = paymentRecord.expiryDate;
        paymentRecord.paymentMethod =
          data.payment?.payment_method || "card";
        paymentRecord.paidAt = new Date();
        await paymentRecord.save();

        // ✅ SIMPLE UPGRADE: Keep current usage, update plan only
        await handleSimpleUpgrade(paymentRecord.userId, paymentRecord.planId);

        console.log(
          "User plan updated via webhook with simple upgrade for order:",
          orderId
        );

        // ✅ AUTO SEND INVOICE (fire-and-forget)
        sendInvoiceAfterPayment(orderId, paymentRecord.userId).catch((err) =>
          console.error("Failed to send invoice email (webhook):", err)
        );
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ success: false });
  }
};

// Get billing history
const getBillingHistory = async (req, res) => {
  try {
    // Check user authentication properly
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated. Please login again.",
      });
    }

    const userId = req.user.id;

    const payments = await Payment.find({
      userId,
      status: { $in: ["success", "failed", "pending"] },
    })
      .populate("planId")
      .sort({ createdAt: -1 })
      .limit(20)
      .select(
        "transactionId amount currency status planName billingCycle createdAt expiryDate paymentMethod paidAt"
      );

    return res.json({
      success: true,
      payments,
    });
  } catch (err) {
    console.error("Get Billing History Error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to get billing history",
    });
  }
};

// Toggle auto-renewal
const toggleAutoRenewal = async (req, res) => {
  try {
    // Check user authentication properly
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated. Please login again.",
      });
    }

    const userId = req.user.id;
    const { autoRenewal } = req.body;

    // Find user's latest successful payment
    const payment = await Payment.findOne({
      userId,
      status: "success",
    }).sort({ createdAt: -1 });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "No active subscription found",
      });
    }

    payment.autoRenewal = autoRenewal;
    payment.renewalStatus = autoRenewal ? "scheduled" : "cancelled";

    await payment.save();

    // Also update user preference
    await User.findByIdAndUpdate(userId, {
      autoRenewal,
    });

    return res.json({
      success: true,
      message: `Auto-renewal ${
        autoRenewal ? "enabled" : "disabled"
      } successfully`,
      autoRenewal: payment.autoRenewal,
      renewalStatus: payment.renewalStatus,
    });
  } catch (err) {
    console.error("Toggle Auto-Renewal Error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update auto-renewal settings",
    });
  }
};

// Get auto-renewal status
const getAutoRenewalStatus = async (req, res) => {
  try {
    // Check user authentication properly
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated. Please login again.",
      });
    }

    const userId = req.user.id;

    // Find user's latest successful payment
    const payment = await Payment.findOne({
      userId,
      status: "success",
    }).sort({ createdAt: -1 });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "No active subscription found",
      });
    }

    return res.json({
      success: true,
      autoRenewal: payment.autoRenewal,
      renewalStatus: payment.renewalStatus,
      nextRenewalDate: payment.nextRenewalDate,
      expiryDate: payment.expiryDate,
      billingCycle: payment.billingCycle,
      planName: payment.planName,
    });
  } catch (err) {
    console.error("Get Auto-Renewal Status Error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to get auto-renewal status",
    });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  handlePaymentWebhook,
  getBillingHistory,
  toggleAutoRenewal,
  getAutoRenewalStatus,
};
