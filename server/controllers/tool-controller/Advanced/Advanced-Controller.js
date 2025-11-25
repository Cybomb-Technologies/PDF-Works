// server/controllers/tool-controller/Advanced/Advanced-Controller.js
const axios = require("axios");
const fs = require('fs').promises;
const path = require('path');
const Advanced = require("../../../models/tools-models/Advanced/Advanced-Model");

// ✅ FIXED: Import usage tracking functions
const { checkLimits } = require("../../../utils/checkLimits");
const { incrementUsage } = require("../../../utils/incrementUsage");

// Save advanced operation to Advanced model
const saveToAdvancedModel = async (operationType, userId, metadata = {}, resultData = null) => {
  try {
    const advancedRecord = new Advanced({
      userId: userId,
      featureType: metadata.featureType || operationType,
      originalName: metadata.originalName || `${operationType}-request`,
      processedName: metadata.processedName || `${operationType}-result`,
      operationType: operationType,
      inputData: metadata.inputData || {},
      resultData: resultData,
      operationStatus: "completed",
      advancedMetadata: metadata
    });

    await advancedRecord.save();
    console.log("✅ Advanced operation saved to Advanced model:", advancedRecord._id);
    return advancedRecord;
  } catch (error) {
    console.error("❌ Error saving to Advanced model:", error);
    throw error;
  }
};

// Download advanced file
const downloadAdvancedFile = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../../../uploads/advanced', filename);

    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    const fileBuffer = await fs.readFile(filePath);
    
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(fileBuffer);

  } catch (error) {
    console.error('Download advanced file error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get user's advanced history
const getAdvancedHistory = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const advancedOps = await Advanced.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      advancedOps
    });

  } catch (error) {
    console.error('Get advanced history error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ✅ FIXED: Unified handler for all advanced tools with COMPREHENSIVE DEBUGGING
exports.handleAdvancedTool = async (req, res) => {
  try {
    const { tool } = req.params;
    const { url, method = "GET", body, headers, tasks } = req.body;
    const userId = req.user?.id;

    console.log('\n🔍 [ADVANCED DEBUG] ===== START REQUEST =====');
    console.log('🔍 [ADVANCED DEBUG] Request received:', {
      tool: tool,
      userId: userId,
      hasUser: !!req.user,
      userData: req.user
    });

    // -------------------------------------------------------
    // ✅ USAGE LIMIT CHECK - FIXED (Same pattern as OrganizeTools)
    // -------------------------------------------------------
    if (userId) {
      try {
        console.log('🔍 [ADVANCED DEBUG] Starting limit check for user:', userId);
        console.log('🔍 [ADVANCED DEBUG] Feature being checked: "advanced-tools"');
        
        const limitCheck = await checkLimits(userId, "advanced-tools");
        
        console.log('🔍 [ADVANCED DEBUG] Limit check result:', {
          allowed: limitCheck.allowed,
          reason: limitCheck.reason,
          currentUsage: limitCheck.usage?.advancedTools,
          limit: limitCheck.plan?.advancedToolsLimit,
          planName: limitCheck.plan?.name,
          userPlan: limitCheck.user?.planName
        });

        // Log the entire limitCheck object to see everything
        console.log('🔍 [ADVANCED DEBUG] Full limitCheck object:', JSON.stringify({
          allowed: limitCheck.allowed,
          reason: limitCheck.reason,
          usage: limitCheck.usage,
          plan: limitCheck.plan ? {
            name: limitCheck.plan.name,
            advancedToolsLimit: limitCheck.plan.advancedToolsLimit,
            planId: limitCheck.plan.planId
          } : null,
          user: limitCheck.user ? {
            planName: limitCheck.user.planName,
            usage: limitCheck.user.usage
          } : null
        }, null, 2));
        
        if (!limitCheck.allowed) {
          console.log('🚫 [ADVANCED DEBUG] Limit exceeded - returning error to frontend');
          return res.status(200).json({
            success: false,
            type: "limit_exceeded",
            title: "Usage Limit Reached",
            message: limitCheck.reason,
            notificationType: "error",
            currentUsage: limitCheck.usage?.advancedTools || 0,
            limit: limitCheck.plan?.advancedToolsLimit || 0,
            upgradeRequired: true
          });
        }
        console.log('✅ [ADVANCED DEBUG] Limits OK - proceeding with operation');
      } catch (limitErr) {
        console.error('❌ [ADVANCED DEBUG] Limit check error:', limitErr);
        return res.status(200).json({
          success: false,
          type: "limit_exceeded",
          title: "Usage Limit Error",
          message: limitErr.message,
          notificationType: "error"
        });
      }
    } else {
      console.log('🔍 [ADVANCED DEBUG] No user ID - skipping limit check');
    }

    let result;
    let operationType;
    let metadata = {};

    switch (tool) {
      case "automation":
        if (!tasks || !Array.isArray(tasks)) {
          return res.status(400).json({ 
            success: false, 
            message: "Tasks array is required" 
          });
        }

        // Simulate automation tasks
        result = tasks.map(task => `${task} completed at ${new Date().toISOString()}`);
        const automationStats = {
          totalTasks: tasks.length,
          completedTasks: tasks.length,
          failedTasks: 0,
          executionTime: `${Math.random() * 1000}ms`
        };

        operationType = "automation-run";
        metadata = {
          featureType: "automation",
          inputData: { tasks },
          originalName: `automation-${Date.now()}`,
          processedName: `automation-result-${Date.now()}`,
          tasksCount: tasks.length,
          processedAt: new Date().toISOString()
        };

        result = {
          tasks: result,
          statistics: automationStats
        };
        break;

      case "api-connect":
        if (!url) {
          return res.status(400).json({ 
            success: false, 
            message: "API URL is required" 
          });
        }

        // Validate URL format
        try {
          new URL(url);
        } catch (urlError) {
          return res.status(400).json({ 
            success: false, 
            message: "Invalid URL format" 
          });
        }

        const startTime = Date.now();
        
        const response = await axios({
          url,
          method: method.toUpperCase(),
          data: body || undefined,
          headers: {
            'Content-Type': 'application/json',
            ...(headers || {})
          },
          timeout: 30000,
          validateStatus: function (status) {
            return status < 500;
          }
        });

        const endTime = Date.now();
        const responseTime = endTime - startTime;

        operationType = "api-call";
        metadata = {
          featureType: "api-connect",
          inputData: { 
            url, 
            method: method.toUpperCase(), 
            body, 
            headers: headers || {} 
          },
          originalName: `api-request-${Date.now()}`,
          processedName: `api-response-${Date.now()}`,
          processedAt: new Date().toISOString(),
          responseTime: responseTime
        };

        result = {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          data: response.data,
          responseTime: `${responseTime}ms`,
          timestamp: new Date().toISOString()
        };
        break;

      case "analytics":
        // Get user-specific analytics if authenticated, otherwise general analytics
        const query = userId ? { userId } : {};
        
        const total = await Advanced.countDocuments(query);
        const automationCount = await Advanced.countDocuments({ ...query, featureType: "automation" });
        const apiCount = await Advanced.countDocuments({ ...query, featureType: "api-connect" });
        const analyticsCount = await Advanced.countDocuments({ ...query, featureType: "analytics" });

        // Get recent activities
        const recentActivities = await Advanced.find(query)
          .sort({ createdAt: -1 })
          .limit(10)
          .select('featureType operationType createdAt advancedMetadata');

        operationType = "analytics-view";
        metadata = {
          featureType: "analytics",
          originalName: `analytics-request-${Date.now()}`,
          processedName: `analytics-data-${Date.now()}`,
          processedAt: new Date().toISOString()
        };

        result = {
          summary: { 
            total, 
            automationCount, 
            apiCount, 
            analyticsCount,
            userSpecific: !!userId
          },
          recentActivities: recentActivities,
          timestamp: new Date().toISOString()
        };
        break;

      default:
        return res.status(400).json({ 
          success: false, 
          message: "Invalid tool specified" 
        });
    }

    // Save to Advanced model if user is authenticated
    let advancedRecord = null;
    if (userId) {
      try {
        console.log('🔍 [ADVANCED DEBUG] Saving to Advanced model for user:', userId);
        advancedRecord = await saveToAdvancedModel(
          operationType,
          userId,
          metadata,
          result
        );

        // ✅ INCREMENT USAGE FOR ADVANCED TOOLS - FIXED
        console.log('🔍 [ADVANCED DEBUG] Before incrementUsage - user:', userId, 'feature: "advanced-tools"');
        
        const incrementResult = await incrementUsage(userId, "advanced-tools");
        
        console.log('🔍 [ADVANCED DEBUG] After incrementUsage - result:', {
          userId: userId,
          newAdvancedToolsUsage: incrementResult?.usage?.advancedTools,
          incrementSuccess: !!incrementResult,
          fullUsageObject: incrementResult?.usage
        });

      } catch (saveError) {
        console.error("❌ [ADVANCED DEBUG] Failed to save/increment:", saveError);
      }
    }

    const responseData = { 
      success: true, 
      data: result,
      message: `${tool} operation completed successfully`,
      advancedId: advancedRecord?._id
    };

    console.log('✅ [ADVANCED DEBUG] Advanced tool operation completed:', { 
      tool, 
      userId, 
      advancedId: advancedRecord?._id,
      currentUsage: userId ? 'incremented' : 'not tracked'
    });
    console.log('🔍 [ADVANCED DEBUG] ===== END REQUEST =====\n');

    res.json(responseData);

  } catch (err) {
    console.error('❌ [ADVANCED DEBUG] Advanced tool error:', err);
    
    // Save failed attempt if user is authenticated
    const userId = req.user?.id;
    if (userId) {
      try {
        await saveToAdvancedModel(
          'failed-operation',
          userId,
          {
            featureType: req.params.tool,
            inputData: req.body,
            originalName: `failed-request-${Date.now()}`,
            processedName: `failed-result-${Date.now()}`,
            processedAt: new Date().toISOString(),
            error: true
          },
          {
            error: err.response?.data || err.message,
            statusCode: err.response?.status,
            timestamp: new Date().toISOString()
          }
        );
      } catch (saveError) {
        console.error("❌ [ADVANCED DEBUG] Failed to save failed operation to Advanced model:", saveError);
      }
    }

    const errorMessage = err.response?.data 
      ? `API Error: ${err.response.status} - ${JSON.stringify(err.response.data)}`
      : err.message || "Unknown error occurred";

    res.status(500).json({ 
      success: false, 
      message: errorMessage 
    });
  }
};

// Export the download and history functions
exports.downloadAdvancedFile = downloadAdvancedFile;
exports.getAdvancedHistory = getAdvancedHistory;