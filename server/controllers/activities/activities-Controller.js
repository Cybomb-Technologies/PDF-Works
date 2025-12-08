const fs = require("fs").promises;
const path = require("path");

// Import all tool models INCLUDING OCR
const Edit = require("../../models/tools-models/Edit/Edit-Model");
const Organize = require("../../models/tools-models/Organize/Organize-Model");
const Security = require("../../models/tools-models/Security/Security-Model");
const Optimize = require("../../models/tools-models/Optimize/Optimize");
const Advanced = require("../../models/tools-models/Advanced/Advanced-Model");
const Convert = require("../../models/tools-models/Convert/Convert");
const OCR = require("../../models/tools-models/OCR/OCR");

// Get all activities
const getAllActivities = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;

   // console.log(`🔍 Fetching activities for user: ${userId}, limit: ${limit}`);

    // Define all model queries INCLUDING OCR
    const queries = [
      Edit.find({ userId })
        .select('originalFilename editedFilename originalFileType editedFileType editType fileSize editStatus downloadUrl createdAt')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),
      
      Organize.find({ userId })
        .select('originalFilenames processedFilename operationType fileSize operationStatus downloadUrl createdAt')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),
      
      Security.find({ userId })
        .select('originalFilename processedFilename operationType fileSize operationStatus downloadUrl createdAt')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),
      
      Optimize.find({ userId })
        .select('originalFilename processedFilename operationType fileSize optimizedFileSize operationStatus downloadUrl createdAt')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),
      
      Advanced.find({ userId })
        .select('originalName processedName featureType operationType inputData resultData operationStatus downloadUrl createdAt')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),
      
      Convert.find({ userId })
        .select('originalFilename convertedFilename originalFileType convertedFileType conversionType fileSize conversionStatus downloadUrl createdAt')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),
      
      // ADD OCR QUERY
      OCR.find({ userId })
        .select('originalFilename processedFilename operationType originalFileSize extractedTextLength fileSize operationStatus downloadUrl createdAt ocrMetadata')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean()
    ];

    // Execute all queries in parallel with error handling
    const results = await Promise.allSettled(queries);

    // Process results with proper error handling and normalization
    const allActivities = [];
    
    results.forEach((result, index) => {
      const toolName = getToolNameByIndex(index);
      
      if (result.status === 'fulfilled') {
        const activities = result.value || [];
        
      //  console.log(`✅ ${toolName}: Found ${activities.length} activities`);
        
        activities.forEach(activity => {
          if (activity && activity._id) {
            const normalizedActivity = normalizeActivityData(activity, toolName);
            if (normalizedActivity) {
              allActivities.push(normalizedActivity);
            }
          }
        });
      } else {
        console.warn(`❌ ${getToolNameByIndex(index)}: Query failed -`, result.reason);
      }
    });

    // Sort by date (newest first)
    allActivities.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Apply overall limit
    const finalActivities = allActivities.slice(0, limit);

    //console.log(`🎯 Total activities found: ${finalActivities.length}`);

    res.json({
      success: true,
      activities: finalActivities,
      total: finalActivities.length,
      tools: getAvailableTools()
    });

  } catch (error) {
    console.error("❌ Activities fetch error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch activities",
      message: error.message
    });
  }
};

// Download any file by tool type and filename
const downloadActivityFile = async (req, res) => {
  try {
    const { tool, filename } = req.params;
    const userId = req.user.id;

    //console.log(`📥 Download request - Tool: ${tool}, File: ${filename}`);

    // Define upload directories for each tool INCLUDING OCR
    const uploadDirs = {
      'edit': path.join(__dirname, '../../../uploads/edited'),
      'organize': path.join(__dirname, '../../../uploads/organized'),
      'security': path.join(__dirname, '../../../uploads/security'),
      'optimize': path.join(__dirname, '../../../uploads/optimize'),
      'advanced': path.join(__dirname, '../../../uploads/advanced'),
      'convert': path.join(__dirname, '../../../uploads/conversions'),
      'ocr': path.join(__dirname, '../../../uploads/ocr') // ADD OCR DIRECTORY
    };

    const uploadDir = uploadDirs[tool];
    if (!uploadDir) {
      return res.status(400).json({
        success: false,
        error: 'Invalid tool type'
      });
    }

    const filePath = path.join(uploadDir, filename);
    //console.log('📁 Looking for file at:', filePath);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      console.log('❌ File not found:', filePath);
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    // Verify user owns this file by checking database
    let userOwnsFile = false;
    try {
      const models = {
        'edit': Edit,
        'organize': Organize,
        'security': Security,
        'optimize': Optimize,
        'advanced': Advanced,
        'convert': Convert,
        'ocr': OCR // ADD OCR MODEL
      };

      const Model = models[tool];
      if (Model) {
        const record = await Model.findOne({ 
          userId: userId,
          $or: [
            { downloadUrl: { $regex: filename, $options: 'i' } },
            { outputPath: { $regex: filename, $options: 'i' } },
            { processedFilename: { $regex: filename, $options: 'i' } }
          ]
        });
        userOwnsFile = !!record;
      }
    } catch (dbError) {
      console.warn('Database check failed, proceeding with download:', dbError);
      userOwnsFile = true; // Proceed if DB check fails
    }

    if (!userOwnsFile) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const fileBuffer = await fs.readFile(filePath);
    //console.log('✅ File found, size:', fileBuffer.length);

    if (fileBuffer.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'File is empty'
      });
    }

    // Determine content type
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
      '.png': 'image/png', '.gif': 'image/gif',
      '.txt': 'text/plain',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };

    const contentType = mimeTypes[ext] || 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', fileBuffer.length);
    res.send(fileBuffer);

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get activity statistics
const getActivityStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await Promise.all([
      Edit.countDocuments({ userId }),
      Organize.countDocuments({ userId }),
      Security.countDocuments({ userId }),
      Optimize.countDocuments({ userId }),
      Advanced.countDocuments({ userId }),
      Convert.countDocuments({ userId }),
      OCR.countDocuments({ userId }) // ADD OCR COUNT
    ]);

    const toolNames = ['edit', 'organize', 'security', 'optimize', 'advanced', 'convert', 'ocr'];
    const result = {};
    
    toolNames.forEach((tool, index) => {
      result[tool] = stats[index];
    });

    result.total = stats.reduce((sum, count) => sum + count, 0);

    res.json({
      success: true,
      stats: result
    });

  } catch (error) {
    console.error("Stats fetch error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch activity statistics"
    });
  }
};

// Helper function to normalize activity data - UPDATE FOR OCR
function normalizeActivityData(activity, toolName) {
  try {
    // Extract filename based on tool-specific field names
    let fileName = 'Unknown File';
    if (activity.originalFilename) fileName = activity.originalFilename;
    else if (activity.originalName) fileName = activity.originalName;
    else if (activity.processedFilename) fileName = activity.processedFilename;
    else if (activity.editedFilename) fileName = activity.editedFilename;
    else if (activity.convertedFilename) fileName = activity.convertedFilename;

    // Extract type based on tool-specific field names
    let type = 'unknown';
    if (activity.editType) type = activity.editType;
    else if (activity.operationType) type = activity.operationType;
    else if (activity.featureType) type = activity.featureType;
    else if (activity.conversionType) type = activity.conversionType;

    // Extract status based on tool-specific field names
    let status = 'completed';
    if (activity.editStatus) status = activity.editStatus;
    else if (activity.operationStatus) status = activity.operationStatus;
    else if (activity.conversionStatus) status = activity.conversionStatus;

    // For OCR, create a special type
    if (toolName === 'ocr') {
      type = 'text-extraction';
      status = activity.operationStatus || 'completed';
    }

    return {
      id: activity._id.toString(),
      fileName: String(fileName).trim(),
      tool: toolName,
      type: String(type).toLowerCase(),
      date: activity.createdAt || new Date().toISOString(),
      status: String(status).toLowerCase(),
      downloadUrl: activity.downloadUrl || null,
      fileSize: Number(activity.fileSize) || activity.originalFileSize || 0,
      metadata: activity,
      // Add OCR-specific metadata
      ocrMetadata: activity.ocrMetadata || null
    };
  } catch (error) {
    console.warn('Failed to normalize activity:', error);
    return null;
  }
}

// Helper function to get tool name by index - UPDATE FOR OCR
function getToolNameByIndex(index) {
  const tools = ['edit', 'organize', 'security', 'optimize', 'advanced', 'convert', 'ocr'];
  return tools[index] || 'unknown';
}

// Helper function to get available tools - UPDATE FOR OCR
function getAvailableTools() {
  return [
    { id: 'all', name: 'All Tools' },
    { id: 'edit', name: 'Edit Tools' },
    { id: 'organize', name: 'Organize Tools' },
    { id: 'security', name: 'Security Tools' },
    { id: 'optimize', name: 'Optimize Tools' },
    { id: 'advanced', name: 'Advanced Tools' },
    { id: 'convert', name: 'Conversions' },
    { id: 'ocr', name: 'OCR Tools' } // ADD OCR TOOL
  ];
}

module.exports = {
  getAllActivities,
  downloadActivityFile,
  getActivityStats
};