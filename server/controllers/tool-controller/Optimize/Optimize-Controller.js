// server/controllers/tool-controller/Optimize/Optimize-Controller.js
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const Optimize = require("../../../models/tools-models/Optimize/Optimize");

// ✅ FIXED: Import usage tracking functions
const { checkLimits } = require("../../../utils/checkLimits");
const { incrementUsage } = require("../../../utils/incrementUsage");

// Save optimize operation to Optimize model
const saveToOptimizeModel = async (fileBuffer, originalFilename, processedFilename, operationType, userId, metadata = {}) => {
  try {
    const uploadsDir = path.join(__dirname, '../../../uploads/optimize');
    await fs.mkdir(uploadsDir, { recursive: true });

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const filename = `optimize-${uniqueSuffix}-${processedFilename}`;
    const filePath = path.join(uploadsDir, filename);

    await fs.writeFile(filePath, fileBuffer);

    const optimizeRecord = new Optimize({
      userId: userId,
      originalFilename: originalFilename,
      processedFilename: processedFilename,
      operationType: operationType,
      fileSize: metadata.originalSize || fileBuffer.length,
      optimizedFileSize: metadata.optimizedSize || fileBuffer.length,
      operationStatus: "completed",
      downloadUrl: `/api/tools/optimize/download/${filename}`,
      outputPath: filePath,
      optimizeMetadata: metadata
    });

    await optimizeRecord.save();
    console.log("✅ Optimize operation saved to Optimize model:", optimizeRecord._id);
    return optimizeRecord;
  } catch (error) {
    console.error("❌ Error saving to Optimize model:", error);
    throw error;
  }
};

// Download optimized file
const downloadOptimizedFile = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../../../uploads/optimize', filename);

    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    const fileBuffer = await fs.readFile(filePath);
    const fileExtension = path.extname(filename).toLowerCase().replace('.', '');

    const mimeTypes = {
      'jpg': 'image/jpeg', 'jpeg': 'image/jpeg',
      'png': 'image/png', 'webp': 'image/webp', 
      'gif': 'image/gif', 'svg': 'image/svg+xml'
    };

    const contentType = mimeTypes[fileExtension] || 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(fileBuffer);

  } catch (error) {
    console.error('Download optimized file error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get user's optimize history
const getOptimizeHistory = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const optimizeOps = await Optimize.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      optimizeOps
    });

  } catch (error) {
    console.error('Get optimize history error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Simple code minifier function
const minifyCode = (type, code) => {
  try {
    let minified = code;

    if (type === "js" || type === "css") {
      // Remove comments and spaces
      minified = code
        .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "")
        .replace(/\s{2,}/g, " ")
        .replace(/\n/g, "");
    } else if (type === "html") {
      // Remove comments and line breaks
      minified = code
        .replace(/<!--.*?-->/gs, "")
        .replace(/\n/g, "")
        .replace(/\s{2,}/g, " ");
    }

    return minified;
  } catch (error) {
    throw new Error('Code minification failed: ' + error.message);
  }
};

const OptimizeController = {
  // Image Optimization - WITH USAGE LIMITS
  optimizeImage: async (req, res) => {
    try {
      console.log('Optimize image request received:', {
        file: req.file ? {
          originalname: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype
        } : 'No file',
        body: req.body,
        user: req.user
      });

      if (!req.file) {
        return res.status(400).json({ 
          success: false,
          error: 'No image file uploaded' 
        });
      }

      const userId = req.user?.id;
      const { quality = 80, maxWidth = 1920, maxHeight = 1080 } = req.body;

      // -------------------------------------------------------
      // ✅ USAGE LIMIT CHECK - FIXED
      // -------------------------------------------------------
      if (userId) {
        try {
          const limitCheck = await checkLimits(userId, "optimize-tools");
          if (!limitCheck.allowed) {
            return res.status(200).json({
              success: false,
              type: "limit_exceeded",
              title: "Usage Limit Reached",
              message: limitCheck.reason,
              notificationType: "error",
              currentUsage: limitCheck.usage?.optimizeTools || 0,
              limit: limitCheck.plan?.optimizeToolsLimit || 0,
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

      // Validate image file
      if (!req.file.mimetype.startsWith('image/')) {
        return res.status(400).json({ 
          success: false,
          error: 'Only image files are supported' 
        });
      }

      const originalSize = req.file.size;
      
      // Optimize image using sharp
      let optimizedBuffer;
      try {
        let sharpInstance = sharp(req.file.buffer);

        // Resize if dimensions provided
        if (maxWidth || maxHeight) {
          sharpInstance = sharpInstance.resize({
            width: parseInt(maxWidth),
            height: parseInt(maxHeight),
            fit: 'inside',
            withoutEnlargement: true
          });
        }

        // Set quality based on format
        if (req.file.mimetype === 'image/jpeg') {
          optimizedBuffer = await sharpInstance.jpeg({ quality: parseInt(quality) }).toBuffer();
        } else if (req.file.mimetype === 'image/png') {
          optimizedBuffer = await sharpInstance.png({ quality: parseInt(quality), compressionLevel: 9 }).toBuffer();
        } else if (req.file.mimetype === 'image/webp') {
          optimizedBuffer = await sharpInstance.webp({ quality: parseInt(quality) }).toBuffer();
        } else {
          // For other formats, just process without specific quality settings
          optimizedBuffer = await sharpInstance.toBuffer();
        }
      } catch (sharpError) {
        console.error('Sharp processing error:', sharpError);
        return res.status(400).json({ 
          success: false,
          error: 'Image processing failed. The file may be corrupted or unsupported.' 
        });
      }

      const optimizedSize = optimizedBuffer.length;
      const sizeReduction = originalSize - optimizedSize;
      const reductionPercent = ((sizeReduction / originalSize) * 100).toFixed(2);

      // Save to Optimize model if user is authenticated
      let optimizeRecord = null;
      if (userId) {
        try {
          optimizeRecord = await saveToOptimizeModel(
            optimizedBuffer,
            req.file.originalname,
            `optimized-${req.file.originalname}`,
            'image-optimization',
            userId,
            {
              originalSize: originalSize,
              optimizedSize: optimizedSize,
              reductionPercent: reductionPercent,
              quality: parseInt(quality),
              maxWidth: parseInt(maxWidth),
              maxHeight: parseInt(maxHeight),
              format: req.file.mimetype,
              processedAt: new Date().toISOString()
            }
          );

          // ✅ INCREMENT USAGE FOR OPTIMIZE TOOLS
          await incrementUsage(userId, "optimize-tools");

        } catch (saveError) {
          console.error("Failed to save to Optimize model:", saveError);
        }
      }

      // Send JSON response with stats AND file data
      res.json({
        success: true,
        stats: {
          originalSize: originalSize,
          optimizedSize: optimizedSize,
          reductionPercent: reductionPercent,
          sizeReduction: sizeReduction
        },
        fileData: optimizedBuffer.toString('base64'),
        fileName: `optimized-${req.file.originalname}`,
        mimeType: req.file.mimetype,
        optimizeId: optimizeRecord?._id,
        downloadUrl: optimizeRecord?.downloadUrl
      });

    } catch (error) {
      console.error('Image optimization error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Image optimization failed: ' + error.message 
      });
    }
  },

  // Code Minification - WITH USAGE LIMITS
  minifyCode: async (req, res) => {
    try {
      console.log('Minify code request received:', {
        body: req.body,
        user: req.user
      });

      const { code, type = 'js' } = req.body;
      const userId = req.user?.id;

      // -------------------------------------------------------
      // ✅ USAGE LIMIT CHECK - FIXED
      // -------------------------------------------------------
      if (userId) {
        try {
          const limitCheck = await checkLimits(userId, "optimize-tools");
          if (!limitCheck.allowed) {
            return res.status(200).json({
              success: false,
              type: "limit_exceeded",
              title: "Usage Limit Reached",
              message: limitCheck.reason,
              notificationType: "error",
              currentUsage: limitCheck.usage?.optimizeTools || 0,
              limit: limitCheck.plan?.optimizeToolsLimit || 0,
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

      if (!code) {
        return res.status(400).json({ 
          success: false,
          error: 'Code is required' 
        });
      }

      if (!['js', 'css', 'html'].includes(type)) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid code type. Supported types: js, css, html' 
        });
      }

      const minifiedCode = minifyCode(type, code);
      const originalLength = code.length;
      const minifiedLength = minifiedCode.length;
      const reductionPercent = ((originalLength - minifiedLength) / originalLength * 100).toFixed(2);

      // Save to Optimize model if user is authenticated
      let optimizeRecord = null;
      if (userId) {
        try {
          // Convert code to buffer for storage
          const codeBuffer = Buffer.from(minifiedCode, 'utf8');
          
          optimizeRecord = await saveToOptimizeModel(
            codeBuffer,
            `code.${type}`,
            `minified-code.${type}`,
            'code-minification',
            userId,
            {
              codeType: type,
              originalLength: originalLength,
              minifiedLength: minifiedLength,
              reductionPercent: reductionPercent,
              processedAt: new Date().toISOString()
            }
          );

          // ✅ INCREMENT USAGE FOR OPTIMIZE TOOLS
          await incrementUsage(userId, "optimize-tools");

        } catch (saveError) {
          console.error("Failed to save to Optimize model:", saveError);
        }
      }

      res.json({
        success: true,
        minifiedCode: minifiedCode,
        stats: {
          originalLength: originalLength,
          minifiedLength: minifiedLength,
          reductionPercent: reductionPercent,
          charactersSaved: originalLength - minifiedLength
        },
        optimizeId: optimizeRecord?._id
      });

    } catch (error) {
      console.error('Code minification error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Code minification failed: ' + error.message 
      });
    }
  },

  // Cache Cleaning - WITH USAGE LIMITS
  cleanCache: async (req, res) => {
    try {
      console.log('Clean cache request received:', {
        user: req.user
      });

      const userId = req.user?.id;

      // -------------------------------------------------------
      // ✅ USAGE LIMIT CHECK - FIXED
      // -------------------------------------------------------
      if (userId) {
        try {
          const limitCheck = await checkLimits(userId, "optimize-tools");
          if (!limitCheck.allowed) {
            return res.status(200).json({
              success: false,
              type: "limit_exceeded",
              title: "Usage Limit Reached",
              message: limitCheck.reason,
              notificationType: "error",
              currentUsage: limitCheck.usage?.optimizeTools || 0,
              limit: limitCheck.plan?.optimizeToolsLimit || 0,
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

      // Save to Optimize model if user is authenticated
      let optimizeRecord = null;
      if (userId) {
        try {
          optimizeRecord = await saveToOptimizeModel(
            Buffer.from(''), // Empty buffer for cache operations
            'cache-clean',
            'cache-cleaned',
            'cache-cleaning',
            userId,
            {
              cleanedAt: new Date().toISOString(),
              cacheTypes: ['localStorage', 'sessionStorage', 'browserCache']
            }
          );

          // ✅ INCREMENT USAGE FOR OPTIMIZE TOOLS
          await incrementUsage(userId, "optimize-tools");

        } catch (saveError) {
          console.error("Failed to save to Optimize model:", saveError);
        }
      }

      res.json({
        success: true,
        message: 'Cache cleaning operation logged successfully',
        timestamp: new Date().toISOString(),
        optimizeId: optimizeRecord?._id
      });

    } catch (error) {
      console.error('Cache cleaning error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Cache cleaning failed: ' + error.message 
      });
    }
  },

  // Export the download and history functions
  downloadOptimizedFile,
  getOptimizeHistory
};

module.exports = OptimizeController;