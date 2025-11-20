const mongoose = require("mongoose");

const pricingPlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    planId: { type: String, required: true, unique: true, lowercase: true },

    // Legacy: kept for admin compatibility
    price: { type: Number, required: true, min: 0 },

    // Multi-currency (USD base)
    currency: { type: String, default: "USD" },

    // Modern billing cycle system
    billingCycles: {
      monthly: { type: Number, required: true, min: 0 }, // USD
      annual: { type: Number, required: true, min: 0 }, // USD
    },

    description: { type: String, required: true },
    period: { type: String, default: "monthly" },

    features: [{ type: String, trim: true }],
    popular: { type: Boolean, default: false },
    ctaText: { type: String, default: "Get Started" },

    // UI fields
    icon: {
      type: String,
      default: "FileText",
      enum: ["Zap", "FileText", "Crown", "Building2"],
    },
    color: { type: String, default: "from-blue-500 to-cyan-600" },

    // Core Limits
    conversionLimit: { type: Number, default: 0 },
    maxFileSize: { type: Number, default: 0 },
    storage: { type: Number, default: 0 },

    // NEW: Tool-specific limits
    editToolsLimit: { type: Number, default: 0 },
    organizeToolsLimit: { type: Number, default: 0 },
    securityToolsLimit: { type: Number, default: 0 },
    optimizeToolsLimit: { type: Number, default: 0 },
    advancedToolsLimit: { type: Number, default: 0 },

    // Advanced toggles
    supportType: {
      type: String,
      enum: ["Community", "Email", "Priority", "24/7 Dedicated"],
      default: "Community",
    },
    hasWatermarks: { type: Boolean, default: false },
    hasBatchProcessing: { type: Boolean, default: false },
    hasOCR: { type: Boolean, default: false },
    hasDigitalSignatures: { type: Boolean, default: false },
    hasAPIAccess: { type: Boolean, default: false },
    hasTeamCollaboration: { type: Boolean, default: false },

    // Control visibility
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PricingPlan", pricingPlanSchema);