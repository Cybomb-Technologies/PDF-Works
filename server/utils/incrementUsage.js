// utils/incrementUsage.js
const User = require("../models/UserModel");
const PricingPlan = require("../models/Pricing");

/**
 * Feature → Credit Key
 */
function getCreditTypeForFeature(feature) {
  const creditMap = {
    "convert": "conversion",
    "conversions": "conversion",
    "edit-tools": "editTools",
    "organize-tools": "organizeTools",
    "security-tools": "securityTools",
    "optimize-tools": "optimizeTools",
    "advanced-tools": "advancedTools"
  };
  return creditMap[feature] || null;
}

/**
 * Feature → Plan Limit Key
 */
function getPlanLimitForFeature(plan, feature) {
  switch (feature) {
    case "convert":
    case "conversions":
      return plan?.conversionLimit || 0;
    case "edit-tools":
      return plan?.editToolsLimit || 0;
    case "organize-tools":
      return plan?.organizeToolsLimit || 0;
    case "security-tools":
      return plan?.securityToolsLimit || 0;
    case "optimize-tools":
      return plan?.optimizeToolsLimit || 0;
    case "advanced-tools":
      return plan?.advancedToolsLimit || 0;
    default:
      return 0;
  }
}

/**
 * Unlimited plans check
 */
function isUnlimitedPlan(limit) {
  return limit === 0 || limit === 99999;
}

/**
 * Current Usage Count
 */
function getCurrentUsageForFeature(usage, feature) {
  switch (feature) {
    case "convert":
    case "conversions":
      return usage.conversions || 0;
    case "edit-tools":
      return usage.editTools || 0;
    case "organize-tools":
      return usage.organizeTools || 0;
    case "security-tools":
      return usage.securityTools || 0;
    case "optimize-tools":
      return usage.optimizeTools || 0;
    case "advanced-tools":
      return usage.advancedTools || 0;
    default:
      return 0;
  }
}

/**
 * 🚀 incrementUsage — final optimized version with proper top-up deduction
 */
async function incrementUsage(userId, feature, options = {}) {
  const { addBytes = 0, count = 1 } = options;
  try {
    const now = new Date();
    let user = await User.findById(userId);
    if (!user) return null;

    console.log("\n================== INCREMENT USAGE ==================");
    console.log(`👤 User: ${userId} | Feature: ${feature} | Count: ${count}`);

    // Default usage structure
    const defaultUsage = {
      conversions: 0,
      compressions: 0,
      ocr: 0,
      signatures: 0,
      edits: 0,
      organizes: 0,
      securityOps: 0,
      operations: 0,
      storageUsedBytes: 0,
      editTools: 0,
      organizeTools: 0,
      securityTools: 0,
      optimizeTools: 0,
      advancedTools: 0,
      resetDate: now
    };

    let needsFix = false;

    // 🧱 Ensure usage structure exists
    if (!user.usage || typeof user.usage !== "object") {
      console.log("⚠️ Fixing empty usage object…");
      user.usage = { ...defaultUsage };
      needsFix = true;
    } else {
      for (const key of Object.keys(defaultUsage)) {
        if (user.usage[key] === undefined) {
          console.log("⚠️ Adding missing usage key:", key);
          user.usage[key] = defaultUsage[key];
          needsFix = true;
        }
      }
    }

    // 🧱 Ensure top-up objects exist
    if (!user.topupCredits) {
      console.log("⚠️ Initializing topup credits…");
      user.topupCredits = {
        conversion: 0,
        editTools: 0,
        organizeTools: 0,
        securityTools: 0,
        optimizeTools: 0,
        advancedTools: 0,
        total: 0
      };
      needsFix = true;
    }

    if (!user.topupUsage) {
      console.log("⚠️ Initializing topup usage…");
      user.topupUsage = {
        conversion: 0,
        editTools: 0,
        organizeTools: 0,
        securityTools: 0,
        optimizeTools: 0,
        advancedTools: 0,
        total: 0
      };
      needsFix = true;
    }

    // 🔄 Reset if cycle expired
    if (user.shouldResetUsage()) {
      console.log("🔄 Resetting monthly cycle usage…");
      user.usage = { ...defaultUsage, resetDate: now };
      needsFix = true;
    }

    if (needsFix) await user.save();

    const usage = user.usage;
    const creditType = getCreditTypeForFeature(feature);
    const currentUsage = getCurrentUsageForFeature(usage, feature);

    let usedPlanCredits = 0;
    let usedTopupCredits = 0;

    // 🏷️ Determine Plan & Topup Allocation
    if (creditType) {
      let plan = null;
      if (user.plan) plan = await PricingPlan.findById(user.plan);
      if (!plan && user.planName) {
        plan = await PricingPlan.findOne({
          $or: [
            { planId: user.planName.toLowerCase() },
            { name: user.planName }
          ]
        });
      }

      const planLimit = getPlanLimitForFeature(plan, feature);
      const topupAvailable = user.topupCredits[creditType] || 0;

      console.log("📊 PLAN vs TOPUP ALLOCATION:");
      console.log("   Plan Limit:", planLimit);
      console.log("   Already Used:", currentUsage);
      console.log("   Topup Available:", topupAvailable);

      let remaining = count;

      if (!isUnlimitedPlan(planLimit) && currentUsage < planLimit) {
        const planLeft = planLimit - currentUsage;
        const planToUse = Math.min(planLeft, remaining);
        usedPlanCredits = planToUse;
        remaining -= planToUse;
      }

      if (remaining > 0 && topupAvailable > 0) {
        const topupToUse = Math.min(remaining, topupAvailable);
        usedTopupCredits = topupToUse;
        user.topupCredits[creditType] -= topupToUse;
        user.topupUsage[creditType] += topupToUse;
        user.topupUsage.total += topupToUse;
      }
    }

    // 📈 APPLY PLAN USAGE COUNT (Topup does NOT increase plan usage)
    const incPlan = usedPlanCredits;

    switch (feature) {
      case "convert":
      case "conversions":
        usage.conversions += incPlan;
        break;
      case "edit-tools":
        usage.editTools += incPlan;
        break;
      case "organize-tools":
        usage.organizeTools += incPlan;
        break;
      case "security-tools":
        usage.securityTools += incPlan;
        break;
      case "optimize-tools":
        usage.optimizeTools += incPlan;
        break;
      case "advanced-tools":
        usage.advancedTools += incPlan;
        break;

      // Not credit-based
      default:
        if (feature === "compress") usage.compressions += count;
        if (feature === "ocr") usage.ocr += count;
        if (feature === "signature") usage.signatures += count;
        if (feature === "upload") usage.operations += count;
    }

    // 🧱 STORAGE UPDATE
    if (addBytes !== 0) {
      usage.storageUsedBytes += addBytes;
      if (usage.storageUsedBytes < 0) usage.storageUsedBytes = 0;
    }

    await user.save();

    console.log("🎉 USAGE UPDATED SUCCESSFULLY!");
    console.log("   ➕ Plan Used:", usedPlanCredits);
    console.log("   💰 Top-up Used:", usedTopupCredits);
    console.log("====================================================\n");

    return {
      user,
      creditsUsed: {
        fromPlan: usedPlanCredits,
        fromTopup: usedTopupCredits,
        creditType,
        topupRemaining: creditType ? user.topupCredits[creditType] : 0
      }
    };

  } catch (err) {
    console.error("❌ incrementUsage ERROR:", err);
    throw new Error(err.message);
  }
}

module.exports = { incrementUsage };
