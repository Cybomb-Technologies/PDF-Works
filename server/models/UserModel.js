const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId; // Password not required if using Google auth
      },
    },
    phone: {
      type: String,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    // Email verification fields
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,

    // Google OAuth
    googleId: {
      type: String,
      sparse: true,
      unique: true,
    },

    // Subscription fields
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PricingPlan",
      default: null,
    },
    planName: {
      type: String,
      default: "Free",
    },
    billingCycle: {
      type: String,
      enum: ["monthly", "annual"],
      default: "monthly",
    },
    subscriptionStatus: {
      type: String,
      enum: ["active", "inactive", "expired", "cancelled"],
      default: "inactive",
    },
    planExpiry: {
      type: Date,
    },

    // Usage tracking
    usage: {
      conversions: { type: Number, default: 0 },
      compressions: { type: Number, default: 0 },
      ocr: { type: Number, default: 0 },
      signatures: { type: Number, default: 0 },
      edits: { type: Number, default: 0 },
      organizes: { type: Number, default: 0 },
      securityOps: { type: Number, default: 0 },
      operations: { type: Number, default: 0 },
      storageUsedBytes: { type: Number, default: 0 },

      // Tool-specific usage tracking
      editTools: { type: Number, default: 0 },
      organizeTools: { type: Number, default: 0 },
      securityTools: { type: Number, default: 0 },
      optimizeTools: { type: Number, default: 0 },
      advancedTools: { type: Number, default: 0 },

      resetDate: { type: Date, default: Date.now },
    },

    // 🔥 NEW: Top-up Credits (Never expire)
    topupCredits: {
      conversion: { type: Number, default: 0 },
      editTools: { type: Number, default: 0 },
      organizeTools: { type: Number, default: 0 },
      securityTools: { type: Number, default: 0 },
      optimizeTools: { type: Number, default: 0 },
      advancedTools: { type: Number, default: 0 },
      convertTools: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    },

    // 🔥 NEW: Top-up Purchase History
    topupPurchases: [{
      packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'TopupPackage' },
      creditsAdded: {
        conversion: { type: Number, default: 0 },
        editTools: { type: Number, default: 0 },
        organizeTools: { type: Number, default: 0 },
        securityTools: { type: Number, default: 0 },
        optimizeTools: { type: Number, default: 0 },
        advancedTools: { type: Number, default: 0 },
        convertTools: { type: Number, default: 0 },
        total: { type: Number, default: 0 }
      },
      purchaseDate: { type: Date, default: Date.now },
      transactionId: { type: String },
      amount: { type: Number },
      currency: { type: String, default: 'USD' }
    }],

    // Auto-renewal preference
    autoRenewal: {
      type: Boolean,
      default: false,
    },

    // Password reset fields
    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  {
    timestamps: true,
  }
);
 
/**
 * Check if usage should reset based on subscription cycle (30 days from last reset)
 */
userSchema.methods.shouldResetUsage = function () {
  const now = new Date();
  const resetDate = this.usage?.resetDate
    ? new Date(this.usage.resetDate)
    : null;

  if (!resetDate) return true;

  const daysSinceLastReset = Math.floor(
    (now - resetDate) / (1000 * 60 * 60 * 24)
  );

  // Reset every 30 days from last reset date
  return daysSinceLastReset >= 30;
};

/**
 * 🔥 NEW: Check if user has enough top-up credits for a specific tool
 */
userSchema.methods.hasTopupCredits = function(toolType, count = 1) {
  const toolMap = {
    'conversions': 'conversion',
    'edit-tools': 'editTools',
    'organize-tools': 'organizeTools',
    'security-tools': 'securityTools',
    'optimize-tools': 'optimizeTools',
    'advanced-tools': 'advancedTools',
    'convert': 'conversion',
    'edit': 'editTools',
    'organize': 'organizeTools',
    'security': 'securityTools',
    'optimize': 'optimizeTools',
    'advanced': 'advancedTools'
  };

  const creditType = toolMap[toolType];
  if (!creditType) return false;

  const credits = this.topupCredits?.[creditType] || 0;
  return credits >= count;
};

/**
 * 🔥 NEW: Get available top-up credits for dashboard
 */
userSchema.methods.getTopupCreditSummary = function() {
  if (!this.topupCredits) {
    return {
      conversion: 0,
      editTools: 0,
      organizeTools: 0,
      securityTools: 0,
      optimizeTools: 0,
      advancedTools: 0,
      convertTools: 0,
      total: 0
    };
  }

  return {
    conversion: this.topupCredits.conversion || 0,
    editTools: this.topupCredits.editTools || 0,
    organizeTools: this.topupCredits.organizeTools || 0,
    securityTools: this.topupCredits.securityTools || 0,
    optimizeTools: this.topupCredits.optimizeTools || 0,
    advancedTools: this.topupCredits.advancedTools || 0,
    convertTools: this.topupCredits.convertTools || 0,
    total: this.topupCredits.total || 0
  };
};

/**
 * 🔥 NEW: Get total available credits (plan + topup)
 */
userSchema.methods.getTotalAvailableCredits = async function(toolType) {
  const plan = await this.refreshPlanData();
  const topupCredits = this.getTopupCreditSummary();
  
  const planLimitMap = {
    'conversion': plan?.conversionLimit || 10,
    'editTools': plan?.editToolsLimit || 10,
    'organizeTools': plan?.organizeToolsLimit || 10,
    'securityTools': plan?.securityToolsLimit || 10,
    'optimizeTools': plan?.optimizeToolsLimit || 10,
    'advancedTools': plan?.advancedToolsLimit || 10,
    'convertTools': plan?.conversionLimit || 10
  };
  
  const toolMap = {
    'conversions': 'conversion',
    'edit-tools': 'editTools',
    'organize-tools': 'organizeTools',
    'security-tools': 'securityTools',
    'optimize-tools': 'optimizeTools',
    'advanced-tools': 'advancedTools',
    'convert': 'conversion',
    'edit': 'editTools',
    'organize': 'organizeTools',
    'security': 'securityTools',
    'optimize': 'optimizeTools',
    'advanced': 'advancedTools'
  };
  
  const creditType = toolMap[toolType] || toolType;
  const planLimit = planLimitMap[creditType] || 0;
  const topupAmount = topupCredits[creditType] || 0;
  
  // Unlimited plan = 99999
  if (planLimit === 0 || planLimit === 99999) {
    return 99999; // Unlimited
  }
  
  return planLimit + topupAmount;
};

/**
 * 🔥 NEW: Get usage with topup consideration for dashboard
 */
userSchema.methods.getDashboardUsage = async function() {
  const plan = await this.refreshPlanData();
  const topupCredits = this.getTopupCreditSummary();
  
  return {
    conversions: {
      used: this.usage?.conversions || 0,
      planLimit: plan?.conversionLimit || 10,
      topup: topupCredits.conversion,
      totalAvailable: (plan?.conversionLimit || 10) + topupCredits.conversion
    },
    editTools: {
      used: this.usage?.editTools || 0,
      planLimit: plan?.editToolsLimit || 10,
      topup: topupCredits.editTools,
      totalAvailable: (plan?.editToolsLimit || 10) + topupCredits.editTools
    },
    organizeTools: {
      used: this.usage?.organizeTools || 0,
      planLimit: plan?.organizeToolsLimit || 10,
      topup: topupCredits.organizeTools,
      totalAvailable: (plan?.organizeToolsLimit || 10) + topupCredits.organizeTools
    },
    securityTools: {
      used: this.usage?.securityTools || 0,
      planLimit: plan?.securityToolsLimit || 10,
      topup: topupCredits.securityTools,
      totalAvailable: (plan?.securityToolsLimit || 10) + topupCredits.securityTools
    },
    optimizeTools: {
      used: this.usage?.optimizeTools || 0,
      planLimit: plan?.optimizeToolsLimit || 10,
      topup: topupCredits.optimizeTools,
      totalAvailable: (plan?.optimizeToolsLimit || 10) + topupCredits.optimizeTools
    },
    advancedTools: {
      used: this.usage?.advancedTools || 0,
      planLimit: plan?.advancedToolsLimit || 10,
      topup: topupCredits.advancedTools,
      totalAvailable: (plan?.advancedToolsLimit || 10) + topupCredits.advancedTools
    }
  };
};

/**
 * Refresh plan data from database (ensures latest limits)
 */
userSchema.methods.refreshPlanData = async function () {
  try {
    const PricingPlan = require("./Pricing");
    let plan = null;

    // Always fetch fresh from database
    if (this.plan) {
      plan = await PricingPlan.findById(this.plan);
    }

    if (!plan && this.planName) {
      plan = await PricingPlan.findOne({
        $or: [{ planId: this.planName.toLowerCase() }, { name: this.planName }],
      });
    }

    if (!plan) {
      plan = await PricingPlan.findOne({ planId: "free" });
    }

    return plan;
  } catch (error) {
    console.error("Error refreshing plan data:", error);
    return null;
  }
};

// Monthly reset logic
userSchema.methods.resetUsageIfNeeded = async function () {
  const now = new Date();

  if (this.shouldResetUsage()) {
    this.usage = {
      conversions: 0,
      compressions: 0,
      ocr: 0,
      signatures: 0,
      edits: 0,
      organizes: 0,
      securityOps: 0,
      operations: 0,
      storageUsedBytes: 0,

      // Reset tool-specific usage
      editTools: 0,
      organizeTools: 0,
      securityTools: 0,
      optimizeTools: 0,
      advancedTools: 0,

      resetDate: now,
    };
    await this.save();
    console.log(`🔄 Usage reset for user ${this._id}`);
    return true;
  }

  return false;
};

/**
 * Get days remaining in current billing cycle
 */
userSchema.methods.getDaysRemainingInCycle = function () {
  const now = new Date();
  const resetDate = this.usage?.resetDate
    ? new Date(this.usage.resetDate)
    : new Date(this.createdAt);

  const daysSinceReset = Math.floor((now - resetDate) / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, 30 - daysSinceReset);

  return daysRemaining;
};

/**
 * Get cycle start and end dates
 */
userSchema.methods.getCycleDates = function () {
  const resetDate = this.usage?.resetDate
    ? new Date(this.usage.resetDate)
    : new Date(this.createdAt);
  const cycleStart = new Date(resetDate);
  const cycleEnd = new Date(resetDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days later

  return {
    cycleStart,
    cycleEnd,
    daysRemaining: this.getDaysRemainingInCycle(),
  };
};

// 🔥 NEW: Pre-save hook to calculate total top-up credits
userSchema.pre('save', function(next) {
  // Calculate top-up credits total
  if (this.topupCredits) {
    this.topupCredits.total = 
      (this.topupCredits.conversion || 0) +
      (this.topupCredits.editTools || 0) +
      (this.topupCredits.organizeTools || 0) +
      (this.topupCredits.securityTools || 0) +
      (this.topupCredits.optimizeTools || 0) +
      (this.topupCredits.advancedTools || 0) +
      (this.topupCredits.convertTools || 0);
  }
  
  next();
});

module.exports = mongoose.model("User", userSchema);