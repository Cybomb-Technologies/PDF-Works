const express = require("express");
const router = express.Router();
const { verifyToken } = require("../../middleware/authMiddleware");

// Import models
const Edit = require("../../models/tools-models/Edit/Edit-Model");
const Organize = require("../../models/tools-models/Organize/Organize-Model");
const Security = require("../../models/tools-models/Security/Security-Model");
const Optimize = require("../../models/tools-models/Optimize/Optimize");
const Advanced = require("../../models/tools-models/Advanced/Advanced-Model");
const Convert = require("../../models/tools-models/Convert/Convert");

// Get comprehensive tool usage summary
router.get("/tool-usage", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get counts from all tool models
    const [
      editCount,
      organizeCount,
      securityCount,
      optimizeCount,
      advancedCount,
      convertCount
    ] = await Promise.all([
      Edit.countDocuments({ userId }),
      Organize.countDocuments({ userId }),
      Security.countDocuments({ userId }),
      Optimize.countDocuments({ userId }),
      Advanced.countDocuments({ userId }),
      Convert.countDocuments({ userId })
    ]);

    // Get recent activities from all tools (last 10)
    const recentActivities = await Promise.all([
      Edit.find({ userId }).sort({ createdAt: -1 }).limit(3),
      Organize.find({ userId }).sort({ createdAt: -1 }).limit(3),
      Security.find({ userId }).sort({ createdAt: -1 }).limit(3),
      Optimize.find({ userId }).sort({ createdAt: -1 }).limit(3),
      Advanced.find({ userId }).sort({ createdAt: -1 }).limit(3)
    ]);

    const activities = recentActivities.flat().sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    ).slice(0, 10);

    res.json({
      success: true,
      toolUsage: {
        editTools: editCount,
        organizeTools: organizeCount,
        securityTools: securityCount,
        optimizeTools: optimizeCount,
        advancedTools: advancedCount,
        conversions: convertCount
      },
      recentActivities: activities.map(activity => ({
        id: activity._id,
        tool: activity.constructor.modelName.toLowerCase(),
        name: activity.originalFilename || activity.originalName,
        type: activity.editType || activity.operationType || activity.featureType,
        date: activity.createdAt,
        status: activity.editStatus || activity.operationStatus
      }))
    });

  } catch (error) {
    console.error("Tool usage summary error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch tool usage summary"
    });
  }
});

module.exports = router;