// utils/checkLimits.js - COMPLETE UPDATED VERSION
const User = require("../models/UserModel");
const PricingPlan = require("../models/Pricing");
const File = require("../models/FileModel");

/**
 * Check if usage should reset based on subscription cycle (30 days from last reset)
 */
function shouldResetBySubscription(lastResetDate, currentDate) {
  if (!lastResetDate) return true;
  
  const lastReset = new Date(lastResetDate);
  const daysSinceLastReset = Math.floor(
    (currentDate - lastReset) / (1000 * 60 * 60 * 24)
  );
  
  // Reset every 30 days from last reset date
  return daysSinceLastReset >= 30;
}

/**
 * Get the latest plan data for a user (always fresh from database)
 */
async function getUserPlan(user) {
  let plan = null;

  // Always fetch fresh plan data from database
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
  
  // Fallback to free plan
  if (!plan) {
    plan = await PricingPlan.findOne({ planId: "free" });
  }

  return plan;
}

async function checkLimits(userId, feature, fileSizeBytes = 0) {
  try {
    console.log(`🔍 CHECKING LIMITS: User ${userId}, Feature: ${feature}`);

    if (!userId) {
      return { 
        allowed: false, 
        reason: "Authentication required",
        notificationType: "error",
        title: "Authentication Required"
      };
    }

    // 1. Load user
    const user = await User.findById(userId);
    if (!user) return { 
      allowed: false, 
      reason: "User not found",
      notificationType: "error",
      title: "User Not Found"
    };

    // 2. Get FRESH plan data from database (not cached)
    const plan = await getUserPlan(user);
    
    if (!plan) {
      return {
        allowed: false,
        reason: "Unable to load plan information",
        notificationType: "error",
        title: "Plan Error"
      };
    }

    console.log("🔍 LIMIT CHECK:", {
      userId: user._id,
      userPlan: user.planName,
      resolvedPlan: plan.name,
      feature: feature,
      editToolsLimit: plan.editToolsLimit,
      currentEditToolsUsage: user.usage?.editTools || 0,
      allowed: user.usage?.editTools < plan.editToolsLimit
    });

    const now = new Date();

    // 3. Ensure usage object has required fields
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

    let usageNeedsFix = false;

    if (!user.usage || typeof user.usage !== "object") {
      user.usage = { ...defaultUsage };
      usageNeedsFix = true;
    } else {
      for (const k of Object.keys(defaultUsage)) {
        if (user.usage[k] === undefined) {
          user.usage[k] = defaultUsage[k];
          usageNeedsFix = true;
        }
      }
    }

    if (usageNeedsFix) {
      await user.save();
    }

    // Reload usage after potential fix
    const usage = user.usage;

    // 4. SUBSCRIPTION CYCLE RESET
    const cycleChanged = shouldResetBySubscription(usage.resetDate, now);

    if (cycleChanged) {
      user.usage = { ...defaultUsage, resetDate: now };
      await user.save();
      console.log(`🔄 Usage reset for user ${userId}`);
    }

    // 5. Extract plan limits
    const conversionLimit = plan?.conversionLimit ?? 0;
    const editToolsLimit = plan?.editToolsLimit ?? 0;
    const organizeToolsLimit = plan?.organizeToolsLimit ?? 0;
    const securityToolsLimit = plan?.securityToolsLimit ?? 0;
    const optimizeToolsLimit = plan?.optimizeToolsLimit ?? 0;
    const advancedToolsLimit = plan?.advancedToolsLimit ?? 0;
    const maxFileSizeMB = plan?.maxFileSize ?? 0;
    const storageLimitGB = plan?.storage ?? 0;
    const storageLimitBytes = storageLimitGB * 1024 * 1024 * 1024;

    // 6. Subscription check (paid plans only)
    if (plan?.planId !== "free" && user.subscriptionStatus !== "active") {
      return {
        allowed: false,
        reason: "Your subscription is inactive. Please renew your subscription to continue using premium features.",
        notificationType: "error",
        title: "Subscription Inactive",
        currentUsage: 0,
        limit: 0,
        upgradeRequired: true
      };
    }

    // 7. File size limit
    if (fileSizeBytes > 0 && maxFileSizeMB > 0) {
      const fileMB = fileSizeBytes / (1024 * 1024);
      if (fileMB > maxFileSizeMB) {
        return {
          allowed: false,
          reason: `File too large. Maximum allowed file size is ${maxFileSizeMB} MB. Your file is ${fileMB.toFixed(1)} MB.`,
          notificationType: "error",
          title: "File Too Large",
          currentUsage: fileMB,
          limit: maxFileSizeMB
        };
      }
    }

    // 8. Storage limit
    if (storageLimitGB > 0) {
      const storageAgg = await File.aggregate([
        { $match: { uploadedBy: user._id } },
        { $group: { _id: null, total: { $sum: "$size" } } }
      ]);
      const usedBytes = storageAgg?.[0]?.total || 0;
      const usedGB = usedBytes / (1024 * 1024 * 1024);

      if (usedBytes + fileSizeBytes > storageLimitBytes) {
        return {
          allowed: false,
          reason: `Storage limit exceeded. You have used ${usedGB.toFixed(1)}GB of ${storageLimitGB}GB storage. Please free up space or upgrade your plan.`,
          notificationType: "error",
          title: "Storage Limit Exceeded",
          currentUsage: usedGB,
          limit: storageLimitGB,
          upgradeRequired: true
        };
      }
    }

    // 9. Feature-specific checks
    switch (feature) {
      case "convert":
      case "conversions":
        if (conversionLimit > 0 && usage.conversions >= conversionLimit) {
          return {
            allowed: false,
            reason: `PDF conversion limit reached. You've used ${usage.conversions} of ${conversionLimit} conversions this month.`,
            notificationType: "error",
            title: "Conversion Limit Reached",
            currentUsage: usage.conversions,
            limit: conversionLimit,
            upgradeRequired: true
          };
        }
        break;

      case "edit-tools":
        if (editToolsLimit > 0 && usage.editTools >= editToolsLimit) {
          return {
            allowed: false,
            reason: `PDF editing tools limit reached. You've used ${usage.editTools} of ${editToolsLimit} edit operations this month.`,
            notificationType: "error",
            title: "Edit Tools Limit Reached",
            currentUsage: usage.editTools,
            limit: editToolsLimit,
            upgradeRequired: true
          };
        }
        break;

      case "organize-tools":
        if (organizeToolsLimit > 0 && usage.organizeTools >= organizeToolsLimit) {
          return {
            allowed: false,
            reason: `Organize tools limit reached (${usage.organizeTools}/${organizeToolsLimit}). Please upgrade your plan.`,
            notificationType: "error",
            title: "Organize Tools Limit Reached",
            currentUsage: usage.organizeTools,
            limit: organizeToolsLimit,
            upgradeRequired: true
          };
        }
        break;

      case "security-tools":
        if (securityToolsLimit > 0 && usage.securityTools >= securityToolsLimit) {
          return {
            allowed: false,
            reason: `Security tools limit reached (${usage.securityTools}/${securityToolsLimit}). Please upgrade your plan.`,
            notificationType: "error",
            title: "Security Tools Limit Reached",
            currentUsage: usage.securityTools,
            limit: securityToolsLimit,
            upgradeRequired: true
          };
        }
        break;

      case "optimize-tools":
        if (optimizeToolsLimit > 0 && usage.optimizeTools >= optimizeToolsLimit) {
          return {
            allowed: false,
            reason: `Optimize tools limit reached (${usage.optimizeTools}/${optimizeToolsLimit}). Please upgrade your plan.`,
            notificationType: "error",
            title: "Optimize Tools Limit Reached",
            currentUsage: usage.optimizeTools,
            limit: optimizeToolsLimit,
            upgradeRequired: true
          };
        }
        break;

      case "advanced-tools":
        if (advancedToolsLimit > 0 && usage.advancedTools >= advancedToolsLimit) {
          return {
            allowed: false,
            reason: `Advanced tools limit reached (${usage.advancedTools}/${advancedToolsLimit}). Please upgrade your plan.`,
            notificationType: "error",
            title: "Advanced Tools Limit Reached",
            currentUsage: usage.advancedTools,
            limit: advancedToolsLimit,
            upgradeRequired: true
          };
        }
        break;

      case "ocr":
        if (!plan?.hasOCR) {
          return { 
            allowed: false, 
            reason: "OCR text recognition requires a Professional plan or higher.",
            notificationType: "error",
            title: "OCR Not Available",
            upgradeRequired: true
          };
        }
        break;

      case "batch":
        if (!plan?.hasBatchProcessing) {
          return { 
            allowed: false, 
            reason: "Batch processing requires a Professional plan or higher.",
            notificationType: "error",
            title: "Batch Processing Not Available",
            upgradeRequired: true
          };
        }
        break;

      case "signature":
        if (!plan?.hasDigitalSignatures) {
          return { 
            allowed: false, 
            reason: "Digital signatures require a Professional plan or higher.",
            notificationType: "error",
            title: "Digital Signatures Not Available",
            upgradeRequired: true
          };
        }
        break;

      case "security":
        if (!plan?.hasWatermarks) {
          return { 
            allowed: false, 
            reason: "Security tools require a Starter plan or higher.",
            notificationType: "error",
            title: "Security Tools Not Available",
            upgradeRequired: true
          };
        }
        break;
    }

    // 10. All good
    return {
      allowed: true,
      reason: null,
      user,
      plan,
      usage: user.usage,
      resetRequired: cycleChanged,
      notificationType: "success"
    };

  } catch (err) {
    console.error("checkLimits error:", err);
    return { 
      allowed: false, 
      reason: "Server error during limit check. Please try again.",
      notificationType: "error",
      title: "Server Error"
    };
  }
}

module.exports = { checkLimits, shouldResetBySubscription, getUserPlan };