const PricingPlan = require("../models/Pricing");
const asyncHandler = require("express-async-handler");

// GLOBAL EXCHANGE RATE (USD → INR)
const EXCHANGE_RATE = process.env.EXCHANGE_RATE
  ? Number(process.env.EXCHANGE_RATE)
  : 83.5;

// =========================================================
// 🔹 FORMAT PLAN FOR CLIENT (BillingPage, Homepage, etc.)
// =========================================================
const formatPlan = (plan) => ({
  id: plan._id,
  planId: plan.planId,
  name: plan.name,

  // Multi Currency
  currency: plan.currency, // USD (base)
  usdPrice: plan.billingCycles?.monthly || plan.price, // fallback

  // Billing cycles
  billingCycles: {
    monthly: plan.billingCycles?.monthly || plan.price,
    annual: plan.billingCycles?.annual || plan.price * 12 * 0.75,
  },

  // INR conversion (client can use this too)
  inrPriceMonthly: Math.round(
    (plan.billingCycles?.monthly || plan.price) * EXCHANGE_RATE
  ),
  inrPriceAnnual: Math.round(
    (plan.billingCycles?.annual || plan.price * 12 * 0.75) * EXCHANGE_RATE
  ),

  // UI
  icon: plan.icon,
  color: plan.color,
  description: plan.description,
  ctaText: plan.ctaText,
  popular: plan.popular,

  // Core Limits
  conversionLimit: plan.conversionLimit,
  maxFileSize: plan.maxFileSize,
  storage: plan.storage,

  // NEW: Tool-specific limits
  editToolsLimit: plan.editToolsLimit || 0,        // Edit tools usage
  organizeToolsLimit: plan.organizeToolsLimit || 0, // Organize tools usage
  securityToolsLimit: plan.securityToolsLimit || 0, // Security tools usage
  optimizeToolsLimit: plan.optimizeToolsLimit || 0, // Optimize tools usage
  advancedToolsLimit: plan.advancedToolsLimit || 0, // Advanced tools usage

  // Features
  features: plan.features,
  supportType: plan.supportType,

  hasWatermarks: plan.hasWatermarks,
  hasBatchProcessing: plan.hasBatchProcessing,
  hasOCR: plan.hasOCR,
  hasDigitalSignatures: plan.hasDigitalSignatures,
  hasAPIAccess: plan.hasAPIAccess,
  hasTeamCollaboration: plan.hasTeamCollaboration,

  isActive: plan.isActive,
  order: plan.order,
});

// =========================================================
// 🔹 GET PUBLIC PRICING PLANS
// =========================================================
const getPricingPlans = asyncHandler(async (req, res) => {
  try {
    const plans = await PricingPlan.find({ isActive: true }).sort({
      order: 1,
      "billingCycles.monthly": 1,
    });

    res.json({
      success: true,
      count: plans.length,
      plans: plans.map(formatPlan),
    });
  } catch (error) {
    console.error("Error fetching pricing plans:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching pricing plans",
    });
  }
});

// =========================================================
// 🔹 GET ALL PLANS FOR ADMIN
// =========================================================
const getPricingPlansAdmin = asyncHandler(async (req, res) => {
  try {
    const plans = await PricingPlan.find().sort({
      order: 1,
      "billingCycles.monthly": 1,
    });

    res.json({
      success: true,
      count: plans.length,
      plans,
    });
  } catch (error) {
    console.error("Error fetching pricing plans for admin:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching pricing plans",
    });
  }
});

// =========================================================
// 🔹 GET SINGLE PLAN
// =========================================================
const getPricingPlan = asyncHandler(async (req, res) => {
  try {
    const plan = await PricingPlan.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Pricing plan not found",
      });
    }

    res.json({
      success: true,
      plan: formatPlan(plan),
    });
  } catch (error) {
    console.error("Error fetching pricing plan:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching pricing plan",
    });
  }
});

// =========================================================
// 🔹 CREATE PLAN (ADMIN)
// =========================================================
const createPricingPlan = asyncHandler(async (req, res) => {
  try {
    const exists = await PricingPlan.findOne({ planId: req.body.planId });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Plan with this ID already exists",
      });
    }

    const plan = await PricingPlan.create({
      ...req.body,
      billingCycles: {
        monthly: req.body.billingCycles?.monthly || req.body.price,
        annual:
          req.body.billingCycles?.annual ||
          req.body.price * 12 * 0.75, // default 25% annual discount
      },
    });

    res.status(201).json({
      success: true,
      message: "Pricing plan created successfully",
      plan,
    });
  } catch (error) {
    console.error("Error creating pricing plan:", error);
    res.status(500).json({
      success: false,
      message: "Error creating pricing plan",
    });
  }
});

// =========================================================
// 🔹 UPDATE PLAN (ADMIN)
// =========================================================
const updatePricingPlan = asyncHandler(async (req, res) => {
  try {
    let plan = await PricingPlan.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Pricing plan not found",
      });
    }

    // Check unique planId
    if (req.body.planId && req.body.planId !== plan.planId) {
      const exists = await PricingPlan.findOne({ planId: req.body.planId });
      if (exists) {
        return res.status(400).json({
          success: false,
          message: "Plan ID already exists",
        });
      }
    }

    // Ensure billing_cycles always valid
    req.body.billingCycles = {
      monthly: req.body.billingCycles?.monthly || req.body.price,
      annual:
        req.body.billingCycles?.annual ||
        req.body.price * 12 * 0.75,
    };

    plan = await PricingPlan.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      message: "Pricing plan updated successfully",
      plan,
    });
  } catch (error) {
    console.error("Error updating pricing plan:", error);
    res.status(500).json({
      success: false,
      message: "Error updating pricing plan",
    });
  }
});

// =========================================================
// 🔹 DELETE PLAN (ADMIN)
// =========================================================
const deletePricingPlan = asyncHandler(async (req, res) => {
  try {
    const plan = await PricingPlan.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Pricing plan not found",
      });
    }

    if (plan.planId === "free") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete free plan",
      });
    }

    await PricingPlan.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Pricing plan deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting pricing plan:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting pricing plan",
    });
  }
});

// =========================================================
// 🔹 INITIALIZE DEFAULT PLANS
// =========================================================
const initializeDefaultPlans = asyncHandler(async (req, res) => {
  try {
    await PricingPlan.deleteMany({});

    const defaultPlans = [
      {
        name: "Free",
        planId: "free",
        price: 0,
        description: "Perfect for getting started with basic PDF needs",
        billingCycles: { monthly: 0, annual: 0 },
        conversionLimit: 10,
        editToolsLimit: 5,
        organizeToolsLimit: 5,
        securityToolsLimit: 3,
        optimizeToolsLimit: 3,
        advancedToolsLimit: 0,
        maxFileSize: 5,
        storage: 1,
        supportType: "Community",
        features: [
          "10 PDF conversions per month",
          "5 Edit tools usage",
          "5 Organize tools usage", 
          "3 Security tools usage",
          "3 Optimize tools usage",
          "5 MB max file size",
          "Basic PDF to Word",
          "Community support",
        ],
        icon: "Zap",
        color: "from-green-500 to-emerald-600",
        order: 0,
      },
      {
        name: "Starter",
        planId: "starter",
        price: 12,
        description: "Perfect for individual users and students",
        billingCycles: { monthly: 12, annual: 108 },
        features: [
          "50 PDF conversions",
          "25 Edit tools usage", 
          "25 Organize tools usage",
          "15 Security tools usage",
          "15 Optimize tools usage",
          "5 Advanced tools usage",
          "10 MB max file size",
          "Email support"
        ],
        conversionLimit: 50,
        editToolsLimit: 25,
        organizeToolsLimit: 25,
        securityToolsLimit: 15,
        optimizeToolsLimit: 15,
        advancedToolsLimit: 5,
        maxFileSize: 10,
        storage: 5,
        supportType: "Email",
        icon: "FileText",
        color: "from-blue-500 to-cyan-600",
        order: 1,
      },
      {
        name: "Professional",
        planId: "professional",
        price: 39,
        description: "Ideal for freelancers and small teams",
        billingCycles: { monthly: 39, annual: 351 },
        features: [
          "500 conversions",
          "200 Edit tools usage",
          "200 Organize tools usage",
          "100 Security tools usage", 
          "100 Optimize tools usage",
          "50 Advanced tools usage",
          "100 MB file limit",
          "Priority support",
          "OCR",
        ],
        conversionLimit: 500,
        editToolsLimit: 200,
        organizeToolsLimit: 200,
        securityToolsLimit: 100,
        optimizeToolsLimit: 100,
        advancedToolsLimit: 50,
        maxFileSize: 100,
        storage: 100,
        supportType: "Priority",
        icon: "Crown",
        color: "from-purple-500 to-pink-500",
        order: 2,
      },
      {
        name: "Enterprise",
        planId: "enterprise",
        price: 0,
        description: "For large organizations",
        billingCycles: { monthly: 0, annual: 0 },
        features: [
          "Unlimited conversions",
          "Unlimited Edit tools",
          "Unlimited Organize tools", 
          "Unlimited Security tools",
          "Unlimited Optimize tools",
          "Unlimited Advanced tools",
          "Team collaboration", 
          "API Access"
        ],
        conversionLimit: 0,
        editToolsLimit: 0,
        organizeToolsLimit: 0,
        securityToolsLimit: 0,
        optimizeToolsLimit: 0,
        advancedToolsLimit: 0,
        maxFileSize: 0,
        storage: 1000,
        supportType: "24/7 Dedicated",
        icon: "Building2",
        color: "from-indigo-600 to-purple-600",
        order: 3,
      },
    ];

    const inserted = await PricingPlan.insertMany(defaultPlans);

    res.json({
      success: true,
      message: "Default pricing plans initialized",
      plans: inserted,
    });
  } catch (error) {
    console.error("Error initializing plans:", error);
    res.status(500).json({
      success: false,
      message: "Error initializing default plans",
    });
  }
});

module.exports = {
  getPricingPlans,
  getPricingPlansAdmin,
  getPricingPlan,
  createPricingPlan,
  updatePricingPlan,
  deletePricingPlan,
  initializeDefaultPlans,
};