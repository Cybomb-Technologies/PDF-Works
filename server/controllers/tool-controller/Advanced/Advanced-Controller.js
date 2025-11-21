const axios = require("axios");
const fs = require('fs').promises;
const path = require('path');
const Advanced = require("../../../models/tools-models/Advanced/Advanced-Model");

// === FIXED USAGE IMPORTS ===
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

// Automation Runner
exports.runAutomation = async (req, res) => {
  try {
    console.log('Automation request received:', {
      body: req.body,
      user: req.user
    });

    const { tasks } = req.body;
    const userId = req.user?.id;

    // -------------------------------------------------------
    // Usage limit check BEFORE processing - FIXED
    // -------------------------------------------------------
    if (userId) {
      try {
        const limitCheck = await checkLimits(userId, "advanced-tools");
        if (!limitCheck.allowed) {
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
      } catch (limitErr) {
        return res.status(200).json({
          success: false,
          type: "limit_exceeded",
          title: "Usage Limit Error",
          message: limitErr.message,
          notificationType: "error"
        });
      }
    }

    if (!tasks || !Array.isArray(tasks)) {
      return res.status(400).json({ 
        success: false, 
        message: "Tasks array is required" 
      });
    }

    // Simulate automation tasks
    const result = tasks.map(task => `${task} completed at ${new Date().toISOString()}`);
    const automationStats = {
      totalTasks: tasks.length,
      completedTasks: tasks.length,
      failedTasks: 0,
      executionTime: `${Math.random() * 1000}ms`
    };

    // Save to Advanced model if user is authenticated
    let advancedRecord = null;
    if (userId) {
      try {
        advancedRecord = await saveToAdvancedModel(
          'automation-run',
          userId,
          {
            featureType: "automation",
            inputData: { tasks },
            originalName: `automation-${Date.now()}`,
            processedName: `automation-result-${Date.now()}`,
            tasksCount: tasks.length,
            processedAt: new Date().toISOString()
          },
          {
            results: result,
            statistics: automationStats,
            timestamp: new Date().toISOString()
          }
        );

        // ✅ Increment usage for advanced tools
        await incrementUsage(userId, "advanced-tools");

      } catch (saveError) {
        console.error("Failed to save to Advanced model:", saveError);
      }
    }

    res.json({ 
      success: true, 
      data: {
        tasks: result,
        statistics: automationStats
      },
      message: `Successfully executed ${tasks.length} automation tasks`,
      advancedId: advancedRecord?._id
    });

  } catch (err) {
    console.error('Automation error:', err);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
};

// API Integrator
exports.callApi = async (req, res) => {
  try {
    console.log('API Connect request received:', {
      body: req.body,
      user: req.user
    });

    const { url, method = "GET", body, headers } = req.body;
    const userId = req.user?.id;

    // -------------------------------------------------------
    // Usage limit check BEFORE processing - FIXED
    // -------------------------------------------------------
    if (userId) {
      try {
        const limitCheck = await checkLimits(userId, "advanced-tools");
        if (!limitCheck.allowed) {
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
      } catch (limitErr) {
        return res.status(200).json({
          success: false,
          type: "limit_exceeded",
          title: "Usage Limit Error",
          message: limitErr.message,
          notificationType: "error"
        });
      }
    }

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
      timeout: 30000, // 30 seconds timeout
      validateStatus: function (status) {
        return status < 500; // Resolve only if status code is less than 500
      }
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    const apiResponseData = {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    };

    // Save to Advanced model if user is authenticated
    let advancedRecord = null;
    if (userId) {
      try {
        advancedRecord = await saveToAdvancedModel(
          'api-call',
          userId,
          {
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
          },
          apiResponseData
        );

        // ✅ Increment usage for advanced tools
        await incrementUsage(userId, "advanced-tools");

      } catch (saveError) {
        console.error("Failed to save to Advanced model:", saveError);
      }
    }

    res.json({ 
      success: true, 
      data: apiResponseData,
      message: `API call completed in ${responseTime}ms with status ${response.status}`,
      advancedId: advancedRecord?._id
    });

  } catch (err) {
    console.error('API Connect error:', err);
    
    // Save failed attempt if user is authenticated
    const userId = req.user?.id;
    if (userId) {
      try {
        await saveToAdvancedModel(
          'api-call',
          userId,
          {
            featureType: "api-connect",
            inputData: req.body,
            originalName: `api-request-${Date.now()}`,
            processedName: `api-failed-${Date.now()}`,
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
        console.error("Failed to save failed API call to Advanced model:", saveError);
      }
    }

    const errorMessage = err.response?.data 
      ? `API Error: ${err.response.status} - ${JSON.stringify(err.response.data)}`
      : err.message || "Unknown API error occurred";

    res.status(500).json({ 
      success: false, 
      message: errorMessage 
    });
  }
};

// Analytics
exports.getAnalytics = async (req, res) => {
  try {
    console.log('Analytics request received:', {
      user: req.user
    });

    const userId = req.user?.id;

    // -------------------------------------------------------
    // Usage limit check BEFORE processing - FIXED
    // -------------------------------------------------------
    if (userId) {
      try {
        const limitCheck = await checkLimits(userId, "advanced-tools");
        if (!limitCheck.allowed) {
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
      } catch (limitErr) {
        return res.status(200).json({
          success: false,
          type: "limit_exceeded",
          title: "Usage Limit Error",
          message: limitErr.message,
          notificationType: "error"
        });
      }
    }

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

    const analyticsData = {
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

    // Save analytics view to Advanced model if user is authenticated
    let advancedRecord = null;
    if (userId) {
      try {
        advancedRecord = await saveToAdvancedModel(
          'analytics-view',
          userId,
          {
            featureType: "analytics",
            originalName: `analytics-request-${Date.now()}`,
            processedName: `analytics-data-${Date.now()}`,
            processedAt: new Date().toISOString()
          },
          analyticsData
        );

        // ✅ Increment usage for advanced tools
        await incrementUsage(userId, "advanced-tools");

      } catch (saveError) {
        console.error("Failed to save to Advanced model:", saveError);
      }
    }

    res.json({ 
      success: true, 
      data: analyticsData,
      message: "Analytics data retrieved successfully",
      advancedId: advancedRecord?._id
    });

  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
};

// Export the download and history functions
exports.downloadAdvancedFile = downloadAdvancedFile;
exports.getAdvancedHistory = getAdvancedHistory;