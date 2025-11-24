const User = require("../models/UserModel");
const PricingPlan = require("../models/Pricing");
const File = require("../models/FileModel");
const mongoose = require("mongoose");

// Feature mapping
const FEATURE_MAP = {
  // Conversion features
  'convert': { usage: 'conversions', limit: 'conversionLimit', name: 'PDF conversions' },
  'conversions': { usage: 'conversions', limit: 'conversionLimit', name: 'PDF conversions' },
  'compress': { usage: 'compressions', limit: 'conversionLimit', name: 'PDF compressions' },
  'ocr': { usage: 'ocr', limit: null, name: 'OCR processing' },
  'signature': { usage: 'signatures', limit: null, name: 'Digital signatures' },
  
  // Tool-specific features
  'edit': { usage: 'edits', limit: null, name: 'PDF edits' },
  'edit-tools': { usage: 'editTools', limit: 'editToolsLimit', name: 'Edit tools' },
  'organize': { usage: 'organizes', limit: null, name: 'PDF organization' },
  'organize-tools': { usage: 'organizeTools', limit: 'organizeToolsLimit', name: 'Organize tools' },
  'security': { usage: 'securityOps', limit: null, name: 'Security operations' },
  'security-tools': { usage: 'securityTools', limit: 'securityToolsLimit', name: 'Security tools' },
  'optimize-tools': { usage: 'optimizeTools', limit: 'optimizeToolsLimit', name: 'Optimize tools' },
  'advanced-tools': { usage: 'advancedTools', limit: 'advancedToolsLimit', name: 'Advanced tools' },
  
  // General operations
  'upload': { usage: 'operations', limit: null, name: 'File uploads' },
  'delete': { usage: null, limit: null, name: 'File deletions' }
};

// Feature availability checks
const FEATURE_AVAILABILITY = {
  'ocr': { planField: 'hasOCR', requiredPlan: 'Professional', message: 'OCR text recognition' },
  'batch': { planField: 'hasBatchProcessing', requiredPlan: 'Professional', message: 'Batch processing' },
  'signature': { planField: 'hasDigitalSignatures', requiredPlan: 'Professional', message: 'Digital signatures' },
  'security': { planField: 'hasWatermarks', requiredPlan: 'Starter', message: 'Security tools' }
};

// Constants
const STORAGE_MULTIPLIERS = {
  GB_TO_BYTES: 1024 * 1024 * 1024,
  MB_TO_BYTES: 1024 * 1024
};

/**
 * Check and increment usage in a single atomic operation
 * This prevents race conditions and ensures data consistency
 */
async function checkAndIncrementUsage(userId, feature, fileSizeBytes = 0, count = 1) {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    
    console.log(`🔐 ATOMIC OPERATION: User ${userId}, Feature: ${feature}, Count: ${count}`);

    // 1. Get user with current usage within transaction
    const user = await User.findById(userId).session(session);
    if (!user) {
      throw new Error('User not found');
    }

    // 2. Get user's plan
    const plan = await getUserPlan(user);
    if (!plan) {
      throw new Error('Unable to load plan information');
    }

    // 3. Initialize usage if needed
    initializeUserUsage(user);

    // 4. Check subscription cycle reset
    const cycleChanged = user.shouldResetUsage ? user.shouldResetUsage() : false;
    if (cycleChanged) {
      resetUserUsage(user);
      console.log(`🔄 Usage reset in atomic operation for user ${userId}`);
    }

    // 5. Get feature configuration
    const featureConfig = FEATURE_MAP[feature];
    if (!featureConfig) {
      throw new Error(`Unknown feature: ${feature}`);
    }

    // Skip usage tracking for features like 'delete'
    if (!featureConfig.usage) {
      await session.commitTransaction();
      return {
        success: true,
        allowed: true,
        user: user,
        plan: plan,
        usage: user.usage,
        incrementApplied: false,
        message: `No usage tracking for ${feature}`
      };
    }

    // 6. Check subscription status for paid plans
    if (plan.planId !== "free" && user.subscriptionStatus !== "active") {
      throw new Error('Subscription inactive. Please renew your subscription.');
    }

    // 7. Check file size limit
    if (fileSizeBytes > 0 && plan.maxFileSize > 0) {
      const fileMB = fileSizeBytes / STORAGE_MULTIPLIERS.MB_TO_BYTES;
      if (fileMB > plan.maxFileSize) {
        throw new Error(`File too large. Maximum allowed: ${plan.maxFileSize}MB, Your file: ${fileMB.toFixed(1)}MB`);
      }
    }

    // 8. Check storage limit
    if (plan.storage > 0) {
      const storageAgg = await File.aggregate([
        { $match: { uploadedBy: user._id } },
        { $group: { _id: null, total: { $sum: "$size" } } }
      ]).session(session);
      
      const usedBytes = storageAgg?.[0]?.total || 0;
      const storageLimitBytes = plan.storage * STORAGE_MULTIPLIERS.GB_TO_BYTES;

      if (usedBytes + fileSizeBytes > storageLimitBytes) {
        const usedGB = usedBytes / STORAGE_MULTIPLIERS.GB_TO_BYTES;
        throw new Error(`Storage limit exceeded. Used: ${usedGB.toFixed(1)}GB of ${plan.storage}GB`);
      }
    }

    // 9. Check feature availability
    const availabilityCheck = FEATURE_AVAILABILITY[feature];
    if (availabilityCheck && !plan[availabilityCheck.planField]) {
      throw new Error(`${availabilityCheck.message} requires ${availabilityCheck.requiredPlan} plan or higher`);
    }

    // 10. Check usage limits
    const usageField = featureConfig.usage;
    const limitField = featureConfig.limit;
    const currentUsage = user.usage[usageField] || 0;
    const limit = limitField ? plan[limitField] : 0;

    if (limit > 0 && (currentUsage + count) > limit) {
      throw new Error(`${featureConfig.name} limit reached. Used: ${currentUsage}/${limit}`);
    }

    // 11. ATOMIC INCREMENT - This is the critical part
    const updateQuery = {
      $inc: { [`usage.${usageField}`]: count }
    };

    // Add storage update if file size provided
    if (fileSizeBytes > 0) {
      updateQuery.$inc['usage.storageUsedBytes'] = fileSizeBytes;
    }

    // Reset usage if cycle changed
    if (cycleChanged) {
      updateQuery.$set = { usage: user.usage };
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateQuery,
      { 
        new: true, 
        session, 
        runValidators: true 
      }
    );

    if (!updatedUser) {
      throw new Error('Failed to update user usage');
    }

    // 12. Commit the transaction
    await session.commitTransaction();
    
    console.log(`✅ ATOMIC SUCCESS: ${feature} +${count} for user ${userId}`);
    console.log(`📊 New usage - ${usageField}: ${updatedUser.usage[usageField]}/${limit}`);

    return {
      success: true,
      allowed: true,
      user: updatedUser,
      plan: plan,
      usage: updatedUser.usage,
      incrementApplied: true,
      previousUsage: currentUsage,
      newUsage: currentUsage + count,
      limit: limit,
      usageField: usageField,
      resetRequired: cycleChanged
    };

  } catch (error) {
    // 13. Abort transaction on any error
    await session.abortTransaction();
    
    console.error(`❌ ATOMIC FAILED: User ${userId}, Feature: ${feature}`, error.message);
    
    return {
      success: false,
      allowed: false,
      error: error.message,
      type: "limit_exceeded",
      title: getErrorTitle(feature),
      message: error.message,
      notificationType: "error",
      currentUsage: 0,
      limit: 0,
      upgradeRequired: error.message.includes('requires') || error.message.includes('subscription')
    };
  } finally {
    session.endSession();
  }
}

/**
 * Batch atomic operations for multiple features
 */
async function checkAndIncrementUsageBatch(userId, operations = []) {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    
    console.log(`🔐 BATCH ATOMIC: User ${userId}, Operations: ${operations.length}`);

    // Get user and plan within transaction
    const user = await User.findById(userId).session(session);
    if (!user) throw new Error('User not found');
    
    const plan = await getUserPlan(user);
    if (!plan) throw new Error('Unable to load plan information');

    // Initialize usage and check reset
    initializeUserUsage(user);
    const cycleChanged = user.shouldResetUsage ? user.shouldResetUsage() : false;
    if (cycleChanged) {
      resetUserUsage(user);
    }

    const updateQuery = { $inc: {} };
    const results = [];
    let totalFileSize = 0;

    // Process each operation
    for (const op of operations) {
      const { feature, count = 1, fileSizeBytes = 0 } = op;
      const featureConfig = FEATURE_MAP[feature];
      
      if (!featureConfig || !featureConfig.usage) {
        results.push({ feature, success: true, skipped: true });
        continue;
      }

      // Check limits for each feature
      const usageField = featureConfig.usage;
      const limitField = featureConfig.limit;
      const currentUsage = user.usage[usageField] || 0;
      const limit = limitField ? plan[limitField] : 0;

      if (limit > 0 && (currentUsage + count) > limit) {
        throw new Error(`${featureConfig.name} limit reached: ${currentUsage + count} > ${limit}`);
      }

      // Add to update query
      updateQuery.$inc[`usage.${usageField}`] = (updateQuery.$inc[`usage.${usageField}`] || 0) + count;
      totalFileSize += fileSizeBytes;

      results.push({ 
        feature, 
        success: true, 
        previousUsage: currentUsage,
        newUsage: currentUsage + count,
        limit: limit
      });
    }

    // Check storage limit for total file size
    if (totalFileSize > 0 && plan.storage > 0) {
      const storageAgg = await File.aggregate([
        { $match: { uploadedBy: user._id } },
        { $group: { _id: null, total: { $sum: "$size" } } }
      ]).session(session);
      
      const usedBytes = storageAgg?.[0]?.total || 0;
      const storageLimitBytes = plan.storage * STORAGE_MULTIPLIERS.GB_TO_BYTES;

      if (usedBytes + totalFileSize > storageLimitBytes) {
        throw new Error('Total storage limit exceeded for batch operations');
      }
      
      updateQuery.$inc['usage.storageUsedBytes'] = totalFileSize;
    }

    // Add cycle reset if needed
    if (cycleChanged) {
      updateQuery.$set = { usage: user.usage };
    }

    // Execute batch update
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateQuery,
      { new: true, session, runValidators: true }
    );

    await session.commitTransaction();
    
    console.log(`✅ BATCH ATOMIC SUCCESS: ${operations.length} operations for user ${userId}`);
    
    return {
      success: true,
      user: updatedUser,
      plan: plan,
      operations: results,
      resetRequired: cycleChanged
    };

  } catch (error) {
    await session.abortTransaction();
    
    console.error(`❌ BATCH ATOMIC FAILED: User ${userId}`, error.message);
    
    return {
      success: false,
      error: error.message,
      operations: operations.map(op => ({ feature: op.feature, success: false, error: error.message }))
    };
  } finally {
    session.endSession();
  }
}

// Helper functions
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
  
  return plan || await PricingPlan.findOne({ planId: "free" });
}

function initializeUserUsage(user) {
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
    resetDate: new Date()
  };

  if (!user.usage || typeof user.usage !== "object") {
    user.usage = { ...defaultUsage };
    return true;
  }

  let needsFix = false;
  for (const key of Object.keys(defaultUsage)) {
    if (user.usage[key] === undefined) {
      user.usage[key] = defaultUsage[key];
      needsFix = true;
    }
  }

  return needsFix;
}

function resetUserUsage(user) {
  user.usage = {
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
    resetDate: new Date()
  };
}

function getErrorTitle(feature) {
  const titles = {
    'advanced-tools': 'Advanced Tools Limit Reached',
    'edit-tools': 'Edit Tools Limit Reached', 
    'organize-tools': 'Organize Tools Limit Reached',
    'security-tools': 'Security Tools Limit Reached',
    'optimize-tools': 'Optimize Tools Limit Reached',
    'convert': 'Conversion Limit Reached',
    'default': 'Usage Limit Reached'
  };
  
  return titles[feature] || titles.default;
}

module.exports = {
  checkAndIncrementUsage,
  checkAndIncrementUsageBatch,
  FEATURE_MAP
};