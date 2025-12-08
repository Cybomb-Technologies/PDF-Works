const axios = require("axios");
const fs = require('fs').promises;
const path = require('path');
const Advanced = require("../../../models/tools-models/Advanced/Advanced-Model");

// Import fixed usage tracking functions
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
      advancedMetadata: {
        ...metadata,
        timestamp: new Date().toISOString()
      }
    });

    await advancedRecord.save();
    //console.log("✅ Advanced operation saved to Advanced model:", advancedRecord._id);
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

// ✅ FIXED: Advanced tool handler with proper topup credit handling
exports.handleAdvancedTool = async (req, res) => {
  try {
    const { tool } = req.params;
    const { url, method = "GET", body, headers, tasks } = req.body;
    const userId = req.user?.id;

    //console.log('\n🔍 [ADVANCED TOOL] ===== START =====');
    //console.log('📱 Request:', { tool, userId });

    // -------------------------------------------------------
    // ✅ FIXED: ENHANCED LIMIT CHECK WITH TOPUP SUPPORT
    // -------------------------------------------------------
    let creditsInfo = null;
    let limitCheck = null;
    
    if (userId) {
      try {
       // console.log('🔍 Checking limits for user:', userId);
        
        limitCheck = await checkLimits(userId, "advanced-tools");
        
        // Detailed logging for debugging
        // console.log('📊 Limit check results:', {
        //   allowed: limitCheck.allowed,
        //   planName: limitCheck.plan?.name,
        //   planLimit: limitCheck.plan?.advancedToolsLimit,
        //   currentUsage: limitCheck.usage?.advancedTools || 0,
        //   usingTopup: limitCheck.creditsInfo?.usingTopup || false,
        //   topupAvailable: limitCheck.creditsInfo?.topupAvailable || 0,
        //   planRemaining: limitCheck.creditsInfo?.planRemaining || 0
        // });
        
        // Store credits info
        creditsInfo = limitCheck.creditsInfo;
        
        if (!limitCheck.allowed) {
         // console.log('🚫 Limit exceeded - blocking operation');
          return res.status(200).json({
            success: false,
            type: "limit_exceeded",
            title: "Usage Limit Reached",
            message: limitCheck.reason,
            notificationType: "error",
            currentUsage: limitCheck.usage?.advancedTools || 0,
            limit: limitCheck.plan?.advancedToolsLimit || 0,
            upgradeRequired: true,
            creditsInfo: {
              planLimit: limitCheck.creditsInfo?.planLimit || 0,
              planUsed: limitCheck.creditsInfo?.planUsed || 0,
              planRemaining: limitCheck.creditsInfo?.planRemaining || 0,
              topupAvailable: limitCheck.creditsInfo?.topupAvailable || 0,
              totalAvailable: limitCheck.creditsInfo?.totalAvailable || 0,
              usingTopup: limitCheck.creditsInfo?.usingTopup || false
            }
          });
        }
        //console.log('✅ Limits check passed');
      } catch (limitErr) {
        console.error('❌ Limit check error:', limitErr);
        return res.status(200).json({
          success: false,
          type: "limit_check_error",
          title: "Usage Limit Error",
          message: "Unable to check usage limits. Please try again.",
          notificationType: "error"
        });
      }
    } else {
     // console.log('⚠️ No user ID - skipping limit check');
    }

    // -------------------------------------------------------
    // PROCESS THE REQUESTED TOOL
    // -------------------------------------------------------
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
        // Analytics might be free - check based on your business logic
        if (userId && limitCheck && !limitCheck.allowed) {
          return res.status(200).json({
            success: false,
            type: "limit_exceeded",
            title: "Usage Limit Reached",
            message: limitCheck.reason,
            notificationType: "error"
          });
        }
        
        const query = userId ? { userId } : {};
        
        const total = await Advanced.countDocuments(query);
        const automationCount = await Advanced.countDocuments({ ...query, featureType: "automation" });
        const apiCount = await Advanced.countDocuments({ ...query, featureType: "api-connect" });
        const analyticsCount = await Advanced.countDocuments({ ...query, featureType: "analytics" });

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

    // -------------------------------------------------------
    // ✅ FIXED: SAVE OPERATION AND INCREMENT USAGE
    // -------------------------------------------------------
    let advancedRecord = null;
    let incrementResult = null;
    
    if (userId) {
      try {
        // Save to database
        advancedRecord = await saveToAdvancedModel(
          operationType,
          userId,
          metadata,
          result
        );

        // ✅ CRITICAL FIX: Only increment usage for tools that consume credits
        // Analytics might be free, adjust based on your needs
        const shouldIncrementUsage = tool !== "analytics";
        
        if (shouldIncrementUsage) {
         // console.log('💰 Incrementing usage for user:', userId);
          
          // This is where the fixed incrementUsage logic will properly handle topup credits
          incrementResult = await incrementUsage(userId, "advanced-tools");
          
          // console.log('📈 Usage increment result:', {
          //   creditsUsed: incrementResult?.creditsUsed?.total || 0,
          //   fromPlan: incrementResult?.creditsUsed?.fromPlan || 0,
          //   fromTopup: incrementResult?.creditsUsed?.fromTopup || 0,
          //   topupRemaining: incrementResult?.creditsUsed?.topupRemaining || 0
          // });
        } else {
          //console.log('📊 Analytics operation - no usage increment needed');
        }

      } catch (saveError) {
        console.error("❌ Error saving/incrementing:", saveError);
        // Continue even if save fails to return the result
      }
    }

    // -------------------------------------------------------
    // BUILD RESPONSE WITH CREDITS INFO
    // -------------------------------------------------------
    const responseData = { 
      success: true, 
      data: result,
      message: `${tool} operation completed successfully`,
      advancedId: advancedRecord?._id,
      creditsInfo: {
        ...(creditsInfo || {}),
        // Add actual usage data if available
        ...(incrementResult?.creditsUsed && {
          creditsUsed: incrementResult.creditsUsed.total,
          fromPlan: incrementResult.creditsUsed.fromPlan,
          fromTopup: incrementResult.creditsUsed.fromTopup,
          topupRemaining: incrementResult.creditsUsed.topupRemaining,
          // Calculate updated values
          planRemaining: Math.max(0, (creditsInfo?.planRemaining || 0) - (incrementResult.creditsUsed.fromPlan || 0)),
          topupAvailable: incrementResult.creditsUsed.topupRemaining || 0
        })
      }
    };

    // console.log('✅ Operation completed successfully');
    // console.log('💰 Final credits info:', responseData.creditsInfo);
    // console.log('🔚 [ADVANCED TOOL] ===== END =====\n');

    res.json(responseData);

  } catch (err) {
    console.error('❌ Advanced tool error:', err);
    
    // Save failed attempt
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
            error: err.message,
            timestamp: new Date().toISOString()
          }
        );
      } catch (saveError) {
        console.error("❌ Failed to save error to database:", saveError);
      }
    }

    const errorMessage = err.response?.data 
      ? `API Error: ${JSON.stringify(err.response.data)}`
      : err.message || "Unknown error";

    res.status(500).json({ 
      success: false, 
      message: errorMessage,
      notificationType: "error"
    });
  }
};

// Additional endpoint to check credits without performing operation
exports.checkAdvancedToolCredits = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const limitCheck = await checkLimits(userId, "advanced-tools");
    
    return res.json({
      success: true,
      allowed: limitCheck.allowed,
      creditsInfo: limitCheck.creditsInfo,
      usage: limitCheck.usage?.advancedTools || 0,
      limit: limitCheck.plan?.advancedToolsLimit || 0
    });

  } catch (error) {
    console.error('Check credits error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Export functions
exports.downloadAdvancedFile = downloadAdvancedFile;
exports.getAdvancedHistory = getAdvancedHistory;