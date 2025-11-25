// server/routes/tools-routes/Advanced/Advanced-Route.js
const express = require("express");
const router = express.Router();
const advancedController = require("../../../controllers/tool-controller/Advanced/Advanced-Controller");
const multer = require("multer");

// Auth middleware
const { verifyToken } = require("../../../middleware/authMiddleware");

// Multer configuration for Advanced routes
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 500 * 1024 * 1024,
    fields: 10,
  },
  fileFilter: (req, file, cb) => {
    cb(null, true);
  }
});

// ✅ FIXED: Use unified route handler like OrganizeTools
router.post('/:tool', verifyToken, multer().none(), advancedController.handleAdvancedTool);

// Download and History
router.get("/download/:filename", advancedController.downloadAdvancedFile);
router.get("/history", verifyToken, advancedController.getAdvancedHistory);

// 🔍 DEBUG ROUTE - Temporary for testing limits
router.get("/debug-usage/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const User = require("../../../models/UserModel");
    const PricingPlan = require("../../../models/Pricing");
    
    const user = await User.findById(userId);
    const freePlan = await PricingPlan.findOne({ planId: "free" });
    const userPlan = user?.planName ? await PricingPlan.findOne({ 
      $or: [
        { planId: user.planName.toLowerCase() },
        { name: user.planName }
      ]
    }) : freePlan;
    
    console.log('🔍 [DEBUG USAGE] User data:', {
      userId: user?._id,
      planName: user?.planName,
      usage: user?.usage,
      advancedToolsUsage: user?.usage?.advancedTools,
      userPlanAdvancedLimit: userPlan?.advancedToolsLimit,
      freePlanAdvancedLimit: freePlan?.advancedToolsLimit
    });

    res.json({
      success: true,
      user: {
        id: user?._id,
        planName: user?.planName,
        usage: user?.usage,
        advancedToolsUsage: user?.usage?.advancedTools
      },
      userPlan: {
        name: userPlan?.name,
        advancedToolsLimit: userPlan?.advancedToolsLimit
      },
      freePlan: {
        name: freePlan?.name,
        advancedToolsLimit: freePlan?.advancedToolsLimit
      }
    });
  } catch (error) {
    console.error('Debug usage error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test route
router.get("/test", (req, res) => {
  res.json({ 
    success: true, 
    message: 'Advanced routes working',
    timestamp: new Date().toISOString(),
    routes: [
      'POST /:tool (automation, api-connect, analytics)',
      'GET /download/:filename',
      'GET /history',
      'GET /debug-usage/:userId (debug)'
    ]
  });
}); 

module.exports = router;