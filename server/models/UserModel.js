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

module.exports = mongoose.model("User", userSchema);
