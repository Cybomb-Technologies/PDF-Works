// utils/checkLimits.js
const User = require("../models/UserModel");
const PricingPlan = require("../models/Pricing");
const File = require("../models/FileModel");

/**
 * 📌 Fetch the user's plan from DB
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

  // Default fallback to free plan
  if (!plan) {
    plan = await PricingPlan.findOne({ planId: "free" });
  }

  return plan;
}

/**
 * 📌 Feature → Topup Mapping
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
    "advanced-tools": "advancedTools"
  };

  return user.topupCredits[map[feature]] || 0;
}

/**
 * 📌 Return combined total allowed (Plan + Topup)
 */
function getTotalAvailable(planLimit, topup) {
  if (planLimit === 0 || planLimit === 99999) return 99999; // Unlimited
  return planLimit + topup;
}

/**
 * 🚨 Main Limit Check Function
 * @param {String} userId
 * @param {String} feature - tool type
 * @param {Number} fileSizeBytes - file size from multer
 */
async function checkLimits(userId, feature, fileSizeBytes = 0) {
  try {
    console.log("\n================== CHECK LIMIT ==================");
    console.log("🔍 Feature:", feature, "| User:", userId);

    if (!userId) {
      return { allowed: false, reason: "Authentication required" };
    }

    // Load user
    const user = await User.findById(userId);
    if (!user) return { allowed: false, reason: "User not found" };

    // Load Plan
    const plan = await getUserPlan(user);
    if (!plan) return { allowed: false, reason: "Plan not found" };

    console.log("📌 Resolved Plan:", plan.name);

    // 🚫 Subscription Check (if not free)
    if (plan?.planId !== "free" && user.subscriptionStatus !== "active") {
      return {
        allowed: false,
        reason: "Subscription inactive",
        upgradeRequired: true
      };
    }

    // Extract Limits
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

    // 🧱 FILE SIZE CHECK (Disk Upload)
    if (fileSizeBytes > 0 && limits.maxFileSizeMB > 0) {
      const fileMB = fileSizeBytes / (1024 * 1024);

      if (fileMB > limits.maxFileSizeMB) {
        console.log(`❌ FILE SIZE BLOCKED (${fileMB.toFixed(1)}MB > ${limits.maxFileSizeMB}MB)`);

        return {
          allowed: false,
          reason: `Max upload limit ${limits.maxFileSizeMB} MB exceeded`,
          upgradeRequired: true
        };
      }
    }

    // 📦 STORAGE CHECK
    if (limits.storageLimitGB > 0) {
      const agg = await File.aggregate([
        { $match: { uploadedBy: user._id } },
        { $group: { _id: null, total: { $sum: "$size" } } }
      ]);
      const usedBytes = agg?.[0]?.total || 0;
      const maxBytes = limits.storageLimitGB * 1024 * 1024 * 1024;

      if (usedBytes + fileSizeBytes > maxBytes) {
        console.log(`❌ STORAGE EXCEEDED`);
        return { allowed: false, reason: "Storage limit exceeded" };
      }
    }

    // 🧮 Determine Usage
    const usage = user?.usage || {};
    const topupCredits = getTopupCreditsForFeature(user, feature);

    function getLimitUsed(limitValue, usedCount) {
      const totalAllowed = getTotalAvailable(limitValue, topupCredits);
      if (totalAllowed === 99999) return true;
      if (usedCount < limitValue) return true;
      if (topupCredits > 0) return true;
      return false;
    }

    // 🔐 TOOL LIMIT CHECK
    switch (feature) {
      case "convert":
      case "conversions":
        if (!getLimitUsed(limits.conversionLimit, usage.conversions || 0)) {
          return { allowed: false, reason: "Conversion limit reached", upgradeRequired: true };
        }
        break;

      case "security-tools":
        if (!getLimitUsed(limits.securityToolsLimit, usage.securityTools || 0)) {
          return { allowed: false, reason: "Security tools limit reached", upgradeRequired: true };
        }
        break;

      case "edit-tools":
        if (!getLimitUsed(limits.editToolsLimit, usage.editTools || 0)) {
          return { allowed: false, reason: "Edit tools limit reached", upgradeRequired: true };
        }
        break;

      case "organize-tools":
        if (!getLimitUsed(limits.organizeToolsLimit, usage.organizeTools || 0)) {
          return { allowed: false, reason: "Organize tools limit reached", upgradeRequired: true };
        }
        break;

      case "optimize-tools":
        if (!getLimitUsed(limits.optimizeToolsLimit, usage.optimizeTools || 0)) {
          return { allowed: false, reason: "Optimize tools limit reached", upgradeRequired: true };
        }
        break;

      case "advanced-tools":
        if (!getLimitUsed(limits.advancedToolsLimit, usage.advancedTools || 0)) {
          return { allowed: false, reason: "Advanced tools limit reached", upgradeRequired: true };
        }
        break;
    }

    console.log("✔️ LIMIT CHECK PASSED");
    console.log("==================================================\n");

    return {
      allowed: true,
      usage,
      plan,
      topupCredits
    };
  } catch (err) {
    console.error("❌ checkLimits ERROR:", err);
    return { allowed: false, reason: "Server error" };
  }
}

module.exports = { checkLimits, getUserPlan };
