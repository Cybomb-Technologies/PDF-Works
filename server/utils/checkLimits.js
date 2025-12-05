const User = require("../models/UserModel");
const PricingPlan = require("../models/Pricing");
const File = require("../models/FileModel");

/**
 * Get plan from DB
 */
async function getUserPlan(user) {
  let plan = null;
  if (user.plan) {
    plan = await PricingPlan.findById(user.plan);
  }
  if (!plan && user.planName) {
    plan = await PricingPlan.findOne({
      $or: [
        { planId: user.planName.toLowerCase() },
        { name: user.planName }
      ]
    });
  }
  if (!plan) {
    plan = await PricingPlan.findOne({ planId: "free" });
  }
  return plan;
}

/**
 * Get topup credits for current feature
 */
function getTopupCreditsForFeature(user, feature) {
  if (!user.topupCredits) return 0;
  const map = {
    "convert": "conversion",
    "conversions": "conversion",
    "edit-tools": "editTools",
    "organize-tools": "organizeTools",
    "security-tools": "securityTools",
    "optimize-tools": "optimizeTools",
    "advanced-tools": "advancedTools",
  };
  return user.topupCredits[map[feature]] || 0;
}

/**
 * Get full available (plan + topup)
 */
function getTotalAvailable(planLimit, topup) {
  if (planLimit === 0 || planLimit === 99999) return 99999;
  return planLimit + topup;
}

/**
 * Limit check function
 */
async function checkLimits(userId, feature, fileSizeBytes = 0) {
  try {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🔍 LIMIT CHECK REQUEST | User: ${userId}`);
    console.log(`   Feature: ${feature}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    if (!userId) {
      console.log(`⛔ No User ID Provided`);
      return { allowed: false, reason: "Authentication required" };
    }

    // Load user
    const user = await User.findById(userId);
    if (!user) {
      console.log(`❌ User Not Found`);
      return { allowed: false, reason: "User not found" };
    }

    // Load plan fresh
    const plan = await getUserPlan(user);
    console.log(`📌 PLAN RESOLVED: ${plan?.name || "None"}`);

    if (!plan) return { allowed: false, reason: "Plan not found" };

    // Topup for this feature
    const topupCredits = getTopupCreditsForFeature(user, feature);

    // Ensure usage object initialized
    const now = new Date();
    const defaultUsage = {
      conversions: 0, compressions: 0, ocr: 0, signatures: 0,
      edits: 0, organizes: 0, securityOps: 0, operations: 0,
      storageUsedBytes: 0,
      editTools: 0, organizeTools: 0, securityTools: 0,
      optimizeTools: 0, advancedTools: 0,
      resetDate: now
    };

    if (!user.usage || typeof user.usage !== "object") {
      console.log(`⚠️ FIXING MISSING USAGE OBJECT`);
      user.usage = { ...defaultUsage };
      await user.save();
    }

    let usage = user.usage;

    // Reset monthly cycle if needed
    if (user.shouldResetUsage()) {
      console.log(`🔄 MONTHLY CYCLE RESET`);
      user.usage = { ...defaultUsage, resetDate: now };
      await user.save();
      usage = user.usage;
    }

    // Extract feature limits
    const limits = {
      conversionLimit: plan?.conversionLimit ?? 0,
      editToolsLimit: plan?.editToolsLimit ?? 0,
      organizeToolsLimit: plan?.organizeToolsLimit ?? 0,
      securityToolsLimit: plan?.securityToolsLimit ?? 0,
      optimizeToolsLimit: plan?.optimizeToolsLimit ?? 0,
      advancedToolsLimit: plan?.advancedToolsLimit ?? 0,
      maxFileSizeMB: plan?.maxFileSize ?? 0,
      storageLimitGB: plan?.storage ?? 0
    };

    // Subscription validation
    if (plan?.planId !== "free" && user.subscriptionStatus !== "active") {
      console.log(`❌ SUBSCRIPTION NOT ACTIVE`);
      return {
        allowed: false,
        reason: "Subscription inactive",
        upgradeRequired: true
      };
    }

    // File Size Check
    if (fileSizeBytes > 0 && limits.maxFileSizeMB > 0) {
      const fileMB = fileSizeBytes / (1024 * 1024);
      if (fileMB > limits.maxFileSizeMB) {
        console.log(`❌ FILE TOO LARGE (${fileMB.toFixed(1)}MB)`);
        return {
          allowed: false,
          reason: `Max file ${limits.maxFileSizeMB} MB exceeded`
        };
      }
    }

    // Storage Limit Check
    if (limits.storageLimitGB > 0) {
      const agg = await File.aggregate([
        { $match: { uploadedBy: user._id } },
        { $group: { _id: null, total: { $sum: "$size" } } }
      ]);
      const usedBytes = agg?.[0]?.total || 0;
      const maxBytes = limits.storageLimitGB * 1024 * 1024 * 1024;

      if (usedBytes + fileSizeBytes > maxBytes) {
        console.log(`❌ STORAGE LIMIT EXCEEDED`);
        return { allowed: false, reason: "Storage limit exceeded" };
      }
    }

    // ================ LIMIT CHECKS ==================

    function checkMax(limit, used) {
      const totalAllowed = getTotalAvailable(limit, topupCredits);
      const isUnlimited = totalAllowed === 99999;

      console.log(`📊 LIMIT CHECK:`);
      console.log(`   PlanLimit: ${limit}`);
      console.log(`   Used: ${used}`);
      console.log(`   Topup: ${topupCredits}`);
      console.log(`   TotalAllowed: ${totalAllowed}`);

      if (isUnlimited) return true;
      if (used < limit) return true; // still in plan
      if (topupCredits > 0) return true; // can use topup

      return false;
    }

    switch (feature) {
      case "convert":
      case "conversions":
        if (!checkMax(limits.conversionLimit, usage.conversions)) {
          console.log(`❌ CONVERSION LIMIT BLOCKED`);
          return { allowed: false, reason: "Conversion credits exhausted", upgradeRequired: true };
        }
        break;

      case "edit-tools":
        if (!checkMax(limits.editToolsLimit, usage.editTools)) {
          return { allowed: false, reason: "Edit tools limit reached", upgradeRequired: true };
        }
        break;

      case "organize-tools":
        if (!checkMax(limits.organizeToolsLimit, usage.organizeTools)) {
          return { allowed: false, reason: "Organize tools limit reached", upgradeRequired: true };
        }
        break;

      case "security-tools":
        if (!checkMax(limits.securityToolsLimit, usage.securityTools)) {
          return { allowed: false, reason: "Security tools limit reached", upgradeRequired: true };
        }
        break;

      case "optimize-tools":
        if (!checkMax(limits.optimizeToolsLimit, usage.optimizeTools)) {
          return { allowed: false, reason: "Optimize tools limit reached", upgradeRequired: true };
        }
        break;

      case "advanced-tools":
        if (!checkMax(limits.advancedToolsLimit, usage.advancedTools)) {
          return { allowed: false, reason: "Advanced tools limit reached", upgradeRequired: true };
        }
        break;
    }

    console.log(`✔️ LIMIT CHECK PASSED`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    return {
      allowed: true,
      usage,
      plan,
      topupCredits
    };

  } catch (err) {
    console.error(`❌ checkLimits ERROR:`, err);
    return { allowed: false, reason: "Server error" };
  }
}

module.exports = { checkLimits, getUserPlan };
