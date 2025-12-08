// server/controllers/toolUsageController.js
const User = require('../models/UserModel');

/**
 * Get comprehensive tool usage statistics for the authenticated user
 * Returns plan usage and topup credits separately
 */
exports.getToolUsageStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
   // console.log('🔍 [USAGE DEBUG] Fetching tool usage for user:', userId);
    
    // Find user with all necessary data
    const user = await User.findById(userId)
      .select('usage plan planName subscriptionStatus topupCredits topupUsage createdAt')
      .populate('plan', 'name planId conversionLimit editToolsLimit organizeToolsLimit securityToolsLimit optimizeToolsLimit advancedToolsLimit maxFileSize storage');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get the user's plan limits
    const PricingPlan = require('../models/Pricing');
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

    // Extract usage data from user object
    const usage = user.usage || {};
    
    // Initialize default usage if missing
    if (!usage.conversions && usage.conversions !== 0) usage.conversions = 0;
    if (!usage.editTools && usage.editTools !== 0) usage.editTools = 0;
    if (!usage.organizeTools && usage.organizeTools !== 0) usage.organizeTools = 0;
    if (!usage.securityTools && usage.securityTools !== 0) usage.securityTools = 0;
    if (!usage.optimizeTools && usage.optimizeTools !== 0) usage.optimizeTools = 0;
    if (!usage.advancedTools && usage.advancedTools !== 0) usage.advancedTools = 0;

    // Initialize topup credits if missing
    const topupCredits = user.topupCredits || {
      conversion: 0,
      editTools: 0,
      organizeTools: 0,
      securityTools: 0,
      optimizeTools: 0,
      advancedTools: 0,
      total: 0
    };

    // Initialize topup usage if missing
    const topupUsage = user.topupUsage || {
      conversion: 0,
      editTools: 0,
      organizeTools: 0,
      securityTools: 0,
      optimizeTools: 0,
      advancedTools: 0,
      total: 0
    };

    // Calculate plan limits with safe defaults
    const planLimits = {
      conversionLimit: plan?.conversionLimit || 10,
      editToolsLimit: plan?.editToolsLimit || 5,
      organizeToolsLimit: plan?.organizeToolsLimit || 5,
      securityToolsLimit: plan?.securityToolsLimit || 5,
      optimizeToolsLimit: plan?.optimizeToolsLimit || 5,
      advancedToolsLimit: plan?.advancedToolsLimit || 5,
      maxFileSize: plan?.maxFileSize || 10,
      storage: plan?.storage || 1
    };

    // console.log('📊 [USAGE DEBUG] Usage data:', {
    //   conversions: usage.conversions,
    //   editTools: usage.editTools,
    //   organizeTools: usage.organizeTools,
    //   securityTools: usage.securityTools,
    //   optimizeTools: usage.optimizeTools,
    //   advancedTools: usage.advancedTools,
    //   planLimits,
    //   topupCredits,
    //   topupUsage
    // });

    // Build comprehensive stats object
    const stats = {
      // ============ PLAN USAGE SECTION ============
      planUsage: {
        conversions: {
          used: usage.conversions || 0,
          limit: planLimits.conversionLimit,
          percentage: this.calculateUsagePercentage(usage.conversions || 0, planLimits.conversionLimit),
          isUnlimited: planLimits.conversionLimit === 0 || planLimits.conversionLimit === 99999
        },
        editTools: {
          used: usage.editTools || 0,
          limit: planLimits.editToolsLimit,
          percentage: this.calculateUsagePercentage(usage.editTools || 0, planLimits.editToolsLimit),
          isUnlimited: planLimits.editToolsLimit === 0 || planLimits.editToolsLimit === 99999
        },
        organizeTools: {
          used: usage.organizeTools || 0,
          limit: planLimits.organizeToolsLimit,
          percentage: this.calculateUsagePercentage(usage.organizeTools || 0, planLimits.organizeToolsLimit),
          isUnlimited: planLimits.organizeToolsLimit === 0 || planLimits.organizeToolsLimit === 99999
        },
        securityTools: {
          used: usage.securityTools || 0,
          limit: planLimits.securityToolsLimit,
          percentage: this.calculateUsagePercentage(usage.securityTools || 0, planLimits.securityToolsLimit),
          isUnlimited: planLimits.securityToolsLimit === 0 || planLimits.securityToolsLimit === 99999
        },
        optimizeTools: {
          used: usage.optimizeTools || 0,
          limit: planLimits.optimizeToolsLimit,
          percentage: this.calculateUsagePercentage(usage.optimizeTools || 0, planLimits.optimizeToolsLimit),
          isUnlimited: planLimits.optimizeToolsLimit === 0 || planLimits.optimizeToolsLimit === 99999
        },
        advancedTools: {
          used: usage.advancedTools || 0,
          limit: planLimits.advancedToolsLimit,
          percentage: this.calculateUsagePercentage(usage.advancedTools || 0, planLimits.advancedToolsLimit),
          isUnlimited: planLimits.advancedToolsLimit === 0 || planLimits.advancedToolsLimit === 99999
        }
      },

      // ============ TOPUP CREDITS SECTION ============
      topupCredits: {
        conversion: {
          available: topupCredits.conversion || 0,
          used: topupUsage.conversion || 0,
          remaining: Math.max(0, (topupCredits.conversion || 0) - (topupUsage.conversion || 0))
        },
        editTools: {
          available: topupCredits.editTools || 0,
          used: topupUsage.editTools || 0,
          remaining: Math.max(0, (topupCredits.editTools || 0) - (topupUsage.editTools || 0))
        },
        organizeTools: {
          available: topupCredits.organizeTools || 0,
          used: topupUsage.organizeTools || 0,
          remaining: Math.max(0, (topupCredits.organizeTools || 0) - (topupUsage.organizeTools || 0))
        },
        securityTools: {
          available: topupCredits.securityTools || 0,
          used: topupUsage.securityTools || 0,
          remaining: Math.max(0, (topupCredits.securityTools || 0) - (topupUsage.securityTools || 0))
        },
        optimizeTools: {
          available: topupCredits.optimizeTools || 0,
          used: topupUsage.optimizeTools || 0,
          remaining: Math.max(0, (topupCredits.optimizeTools || 0) - (topupUsage.optimizeTools || 0))
        },
        advancedTools: {
          available: topupCredits.advancedTools || 0,
          used: topupUsage.advancedTools || 0,
          remaining: Math.max(0, (topupCredits.advancedTools || 0) - (topupUsage.advancedTools || 0))
        },
        total: {
          available: topupCredits.total || 0,
          used: topupUsage.total || 0,
          remaining: Math.max(0, (topupCredits.total || 0) - (topupUsage.total || 0))
        }
      },

      // ============ USER & PLAN INFO ============
      userInfo: {
        planName: plan?.name || 'Free Plan',
        planId: plan?.planId || 'free',
        subscriptionStatus: user.subscriptionStatus || 'active',
        joinedDate: user.createdAt
      },

      // ============ RESET INFO ============
      resetInfo: {
        resetDate: usage.resetDate || new Date(),
        nextReset: user.shouldResetUsage ? user.shouldResetUsage() : false,
        monthlyCycle: true
      }
    };

   // console.log('✅ [USAGE DEBUG] Stats prepared successfully');

    res.json({
      success: true,
      stats,
      message: 'Tool usage statistics retrieved successfully'
    });

  } catch (error) {
    console.error('❌ [USAGE DEBUG] Error fetching tool usage stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tool usage statistics',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Helper function to calculate usage percentage
 */
exports.calculateUsagePercentage = (used, total) => {
  if (total === 0 || total === 99999) return 0; // Unlimited plan
  if (used >= total) return 100;
  return Math.round((used / total) * 100);
};