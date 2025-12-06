const User = require("../models/UserModel");

/**
 * Map feature → topup credit type
 */
function getCreditTypeForFeature(feature) {
  const creditMap = {
    'convert': 'conversion',
    'conversions': 'conversion',
    'edit-tools': 'editTools',
    'organize-tools': 'organizeTools',
    'security-tools': 'securityTools',
    'optimize-tools': 'optimizeTools',
    'advanced-tools': 'advancedTools'
  };
  return creditMap[feature] || null;
}

/**
 * Map feature → plan limit property
 */
function getPlanLimitForFeature(plan, feature) {
  switch (feature) {
    case 'convert':
    case 'conversions':
      return plan?.conversionLimit || 0;
    case 'edit-tools':
      return plan?.editToolsLimit || 0;
    case 'organize-tools':
      return plan?.organizeToolsLimit || 0;
    case 'security-tools':
      return plan?.securityToolsLimit || 0;
    case 'optimize-tools':
      return plan?.optimizeToolsLimit || 0;
    case 'advanced-tools':
      return plan?.advancedToolsLimit || 0;
    default:
      return 0;
  }
}

/**
 * Unlimited plan?
 */
function isUnlimitedPlan(planLimit) {
  return planLimit === 0 || planLimit === 99999;
}

/**
 * Helper: get current usage count for feature
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
 * 🚀 incrementUsage – now correctly handles topups
 */
async function incrementUsage(userId, feature, options = {}) {
  const { addBytes = 0, count = 1 } = options;

  try {
    const now = new Date();

    // Load user
    let user = await User.findById(userId);
    if (!user) return null;

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🔧 INCREMENT REQUEST | User: ${userId}`);
    console.log(`   Feature: ${feature}, Count: ${count}`);

    // ---------------------------------------
    // 1. Ensure usage + topup objects exist
    // ---------------------------------------
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

    // If missing usage object
    if (!user.usage || typeof user.usage !== "object") {
      console.log(`⚠️ Fixing missing usage object...`);
      user.usage = { ...defaultUsage };
      needsFix = true;
    } else {
      for (const key of Object.keys(defaultUsage)) {
        if (user.usage[key] === undefined) {
          console.log(`⚠️ Fixing missing usage key: ${key}`);
          user.usage[key] = defaultUsage[key];
          needsFix = true;
        }
      }
    }

    // Initialize topup credits if missing
    if (!user.topupCredits) {
      console.log(`⚠️ Initializing topup credits...`);
      user.topupCredits = {
        conversion: 0,
        editTools: 0,
        organizeTools: 0,
        securityTools: 0,
        optimizeTools: 0,
        advancedTools: 0,
        convertTools: 0,
        total: 0
      };
      needsFix = true;
    }

    // Initialize tracking if missing
    if (!user.topupUsage) {
      console.log(`⚠️ Initializing topup usage...`);
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

    // Reset cycle if needed
    if (user.shouldResetUsage()) {
      console.log(`🔄 Resetting monthly cycle`);
      user.usage = { ...defaultUsage, resetDate: now };
      needsFix = true;
    }

    if (needsFix) await user.save();

    const usage = user.usage;
    const creditType = getCreditTypeForFeature(feature);
    const currentUsage = getCurrentUsageForFeature(usage, feature);

    let usedPlanCredits = 0;
    let usedTopupCredits = 0;

    // ---------------------------------------
    // 2. Allocate credits: plan → topup
    // ---------------------------------------
    if (creditType) {
      const PricingPlan = require("../models/Pricing");

      let plan = null;
      if (user.plan) plan = await PricingPlan.findById(user.plan);
      if (!plan && user.planName) {
        plan = await PricingPlan.findOne({
          $or: [{ planId: user.planName.toLowerCase() }, { name: user.planName }]
        });
      }

      const planLimit = getPlanLimitForFeature(plan, feature);
      const topupAvailable = user.topupCredits[creditType] || 0;

      console.log(`📊 PLAN vs TOPUP CHECK:`);
      console.log(`   planLimit = ${planLimit}`);
      console.log(`   used = ${currentUsage}`);
      console.log(`   topupAvailable = ${topupAvailable}`);

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

    // ---------------------------------------
    // 3. Increment usage counters: ONLY PLAN COUNTS!
    // ---------------------------------------
    console.log(`📈 Updating counters...`);

    const incPlan = usedPlanCredits; // DO NOT count topups here

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

      // Non credit-based
      default:
        if (feature === "compress") usage.compressions += count;
        if (feature === "ocr") usage.ocr += count;
        if (feature === "signature") usage.signatures += count;
        if (feature === "upload") usage.operations += count;
    }

    // Storage updates
    if (addBytes !== 0) {
      usage.storageUsedBytes += addBytes;
      if (usage.storageUsedBytes < 0) usage.storageUsedBytes = 0;
    }

    await user.save();

    console.log(`\n🎉 USAGE UPDATED SUCCESSFULLY`);
    console.log(`   ➕ PLAN used: ${usedPlanCredits}`);
    console.log(`   💰 TOPUP used: ${usedTopupCredits}`);
    console.log(`   📌 New usage:`, usage);
    console.log(`   💳 Remaining topup: ${creditType ? user.topupCredits[creditType] : "-"}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    return {
      user,
      creditsUsed: {
        fromPlan: usedPlanCredits,
        fromTopup: usedTopupCredits,
        creditType,
        topupRemaining: creditType ? user.topupCredits[creditType] : 0,
      }
    };
  } catch (err) {
    console.error(`❌ incrementUsage ERROR:`, err);
    throw new Error(err.message);
  }
}

module.exports = { incrementUsage };
