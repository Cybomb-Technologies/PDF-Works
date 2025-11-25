// controllers/fileController.js - COMPLETE REPLACEMENT
const Convert = require("../models/tools-models/Convert/Convert");
const Organize = require("../models/tools-models/Organize/Organize-Model");
const Optimize = require("../models/tools-models/Optimize/Optimize");
const Edit = require("../models/tools-models/Edit/Edit-Model");
const Security = require("../models/tools-models/Security/Security-Model");
const Advanced = require("../models/tools-models/Advanced/Advanced-Model");
const File = require("../models/FileModel");
const fs = require("fs-extra");
const path = require("path");

// Get ALL user files from ALL tools
const getUserFiles = async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log('🔍 Fetching ALL files for user:', userId);

    // Fetch files from ALL models in parallel
    const [
      convertFiles,
      organizeFiles, 
      optimizeFiles,
      editFiles,
      securityFiles,
      advancedFiles
    ] = await Promise.all([
      // Convert tools (FileModel)
      File.find({ uploadedBy: userId })
        .select('filename originalName path size uploadedAt category toolUsed')
        .sort({ uploadedAt: -1 }),
      
      // Organize tools
      Organize.find({ userId })
        .select('processedFilename originalFilenames downloadUrl fileSize createdAt operationType outputPath')
        .sort({ createdAt: -1 }),
      
      // Optimize tools  
      Optimize.find({ userId })
        .select('processedFilename originalFilename downloadUrl fileSize optimizedFileSize createdAt operationType outputPath')
        .sort({ createdAt: -1 }),
      
      // Edit tools
      Edit.find({ userId })
        .select('editedFilename originalFilename downloadUrl fileSize createdAt editType outputPath editMetadata')
        .sort({ createdAt: -1 }),
      
      // Security tools
      Security.find({ userId })
        .select('processedFilename originalFilename downloadUrl fileSize createdAt operationType outputPath')
        .sort({ createdAt: -1 }),
      
      // Advanced tools
      Advanced.find({ userId })
        .select('processedName originalName downloadUrl createdAt operationType featureType outputPath')
        .sort({ createdAt: -1 })
    ]);

    console.log('📊 Files found from all tools:', {
      convert: convertFiles.length,
      organize: organizeFiles.length,
      optimize: optimizeFiles.length,
      edit: editFiles.length,
      security: securityFiles.length,
      advanced: advancedFiles.length
    });

    // Transform all files to consistent format
    const allFiles = [
      // Convert files
      ...convertFiles.map(file => ({
        _id: file._id,
        source: 'convert',
        filename: file.originalName,
        displayName: file.filename,
        path: file.path,
        size: file.size,
        uploadedAt: file.uploadedAt,
        category: file.category || 'converted',
        toolUsed: file.toolUsed || 'convert',
        toolCategory: 'convert',
        downloadUrl: `/api/files/download/${file._id}`,
        type: 'file'
      })),
      
      // Organize files
      ...organizeFiles.map(file => ({
        _id: file._id,
        source: 'organize',
        filename: file.processedFilename,
        displayName: file.originalFilenames?.join(', ') || file.processedFilename,
        path: file.outputPath || file.downloadUrl,
        size: file.fileSize,
        uploadedAt: file.createdAt,
        category: 'organized',
        toolUsed: file.operationType,
        toolCategory: 'organize',
        downloadUrl: `/api/files/download/${file._id}`,
        type: 'file'
      })),
      
      // Optimize files
      ...optimizeFiles.map(file => ({
        _id: file._id,
        source: 'optimize',
        filename: file.processedFilename,
        displayName: file.originalFilename,
        path: file.outputPath || file.downloadUrl,
        size: file.optimizedFileSize || file.fileSize,
        uploadedAt: file.createdAt,
        category: 'optimized',
        toolUsed: file.operationType,
        toolCategory: 'optimize',
        downloadUrl: `/api/files/download/${file._id}`,
        type: 'file'
      })),
      
      // Edit files
      ...editFiles.map(file => ({
        _id: file._id,
        source: 'edit',
        filename: file.editedFilename,
        displayName: file.originalFilename,
        path: file.outputPath || file.downloadUrl,
        size: file.fileSize,
        uploadedAt: file.createdAt,
        category: 'edited',
        toolUsed: file.editType,
        toolCategory: 'edit',
        downloadUrl: file.editType === 'file-rename' ? `/api/files/download-batch/${file.editMetadata?.batchId}` : `/api/files/download/${file._id}`,
        type: file.editType === 'file-rename' ? 'batch' : 'file',
        batchInfo: file.editType === 'file-rename' ? {
          totalFiles: file.editMetadata?.totalFiles || 0,
          batchId: file.editMetadata?.batchId
        } : null
      })),
      
      // Security files
      ...securityFiles.map(file => ({
        _id: file._id,
        source: 'security',
        filename: file.processedFilename,
        displayName: file.originalFilename,
        path: file.outputPath || file.downloadUrl,
        size: file.fileSize,
        uploadedAt: file.createdAt,
        category: 'secured',
        toolUsed: file.operationType,
        toolCategory: 'security',
        downloadUrl: `/api/files/download/${file._id}`,
        type: 'file'
      })),
      
      // Advanced files
      ...advancedFiles.filter(file => file.downloadUrl).map(file => ({
        _id: file._id,
        source: 'advanced',
        filename: file.processedName,
        displayName: file.originalName,
        path: file.outputPath || file.downloadUrl,
        size: 0,
        uploadedAt: file.createdAt,
        category: 'advanced',
        toolUsed: file.featureType,
        toolCategory: 'advanced',
        downloadUrl: `/api/files/download/${file._id}`,
        type: 'file'
      }))
    ];

    // Sort all files by date (newest first)
    allFiles.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    console.log('✅ Total files to return:', allFiles.length);

    res.json(allFiles);

  } catch (error) {
    console.error('❌ Get all files error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch files: ' + error.message
    });
  }
};

// Enhanced download to handle ALL tools
const downloadFile = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('📥 Download request for file ID:', id);
    console.log('🔐 User authenticated:', !!req.user);

    // Check authentication FIRST
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        success: false, 
        error: "No token provided",
        message: "User not authenticated. Please login again."
      });
    }

    const userId = req.user.id.toString();
    console.log('👤 Request user ID:', userId);

    // Try to find file in ALL models
    let file = await File.findById(id);
    let source = 'convert';

    if (!file) {
      file = await Organize.findById(id);
      source = 'organize';
    }
    if (!file) {
      file = await Optimize.findById(id);
      source = 'optimize';
    }
    if (!file) {
      file = await Edit.findById(id);
      source = 'edit';
    }
    if (!file) {
      file = await Security.findById(id);
      source = 'security';
    }
    if (!file) {
      file = await Advanced.findById(id);
      source = 'advanced';
    }

    if (!file) {
      return res.status(404).json({ 
        success: false,
        error: 'File not found' 
      });
    }

    console.log('📄 File found:', {
      source: source,
      id: file._id,
      filename: file.filename || file.processedFilename,
      userId: file.userId,
      uploadedBy: file.uploadedBy
    });

    // Check if user owns this file
    if (file.userId && file.userId.toString() !== userId) {
      console.log('🚫 User ID mismatch:', {
        fileUserId: file.userId?.toString(),
        requestUserId: userId
      });
      return res.status(403).json({ 
        success: false,
        error: 'Access denied' 
      });
    }
    if (file.uploadedBy && file.uploadedBy.toString() !== userId) {
      console.log('🚫 UploadedBy mismatch:', {
        fileUploadedBy: file.uploadedBy?.toString(),
        requestUserId: userId
      });
      return res.status(403).json({ 
        success: false,
        error: 'Access denied' 
      });
    }

    // Determine file path
    let filePath = file.outputPath || file.path || file.downloadUrl;
    
    console.log('📍 Original file path:', filePath);

    // Remove API prefix if present
    if (filePath && filePath.startsWith('/api/')) {
      filePath = filePath.replace('/api/', '');
    }

    // For downloadUrl, extract the actual file path
    if (file.downloadUrl && !filePath) {
      filePath = file.downloadUrl.replace('/api/tools/', 'uploads/')
                                .replace('/api/files/', 'uploads/')
                                .replace('/download/', '');
    }

    // If still no path, try to construct from common patterns
    if (!filePath) {
      const filename = file.processedFilename || file.filename;
      if (filename) {
        filePath = path.join('uploads', `${source}_files`, filename);
      }
    }

    console.log('📁 Final file path:', filePath);

    if (!filePath) {
      return res.status(404).json({ 
        success: false,
        error: 'File path not found' 
      });
    }

    // Check if file exists
    try {
      await fs.access(filePath);
      console.log('✅ File exists at path');
    } catch {
      console.log('❌ Physical file not found at:', filePath);
      
      // Try alternative paths
      const alternativePaths = [
        path.join(__dirname, '..', '..', filePath),
        path.join('uploads', filePath),
        filePath
      ];
      
      let foundPath = null;
      for (const altPath of alternativePaths) {
        try {
          await fs.access(altPath);
          foundPath = altPath;
          console.log('✅ File found at alternative path:', altPath);
          break;
        } catch (e) {
          // Continue to next path
        }
      }
      
      if (!foundPath) {
        return res.status(404).json({ 
          success: false,
          error: 'Physical file not found at any location' 
        });
      }
      
      filePath = foundPath;
    }

    // Get filename for download
    const filename = file.originalName || file.originalFilename || file.processedFilename || file.filename || 'download';

    // Set headers and send file
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Determine content type
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
      '.png': 'image/png', '.gif': 'image/gif',
      '.txt': 'text/plain',
      '.enc': 'application/octet-stream',
      '.zip': 'application/zip'
    };
    
    res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
    
    // Stream the file
    const fileStream = require('fs').createReadStream(filePath);
    
    fileStream.on('error', (error) => {
      console.error('❌ File stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ 
          success: false,
          error: 'File stream error' 
        });
      }
    });
    
    fileStream.pipe(res);

    console.log('✅ File download successful:', filename);

  } catch (error) {
    console.error('❌ Download file error:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false,
        error: 'Download failed: ' + error.message 
      });
    }
  }
};

// Download batch files (for file rename operations)
const downloadBatchFiles = async (req, res) => {
  try {
    const { batchId } = req.params;
    
    console.log('📦 Download batch request:', batchId);
    console.log('🔐 User authenticated:', !!req.user);

    // Check authentication FIRST
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        success: false, 
        error: "No token provided",
        message: "User not authenticated. Please login again."
      });
    }

    const editRecord = await Edit.findOne({ 
      'editMetadata.batchId': batchId,
      editType: 'file-rename'
    });

    if (!editRecord) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    // Check if user owns this batch
    if (editRecord.userId && editRecord.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Use the existing downloadBatch method from EditController
    const EditController = require('./tool-controller/Edit/Edit-Controller');
    return EditController.downloadBatch(req, res);

  } catch (error) {
    console.error('Download batch error:', error);
    res.status(500).json({ error: 'Batch download failed' });
  }
};

// Save converted file (keep existing functionality)
const saveConvertedFile = async (req, res) => {
  try {
    const {
      originalName,
      fileBuffer,
      mimetype,
      toolUsed = "convert",
    } = req.body;
 
    if (!fileBuffer || !originalName) {
      return res.status(400).json({
        success: false,
        error: "File buffer and original name are required",
      });
    }

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: "User authentication required",
      });
    }

    // Convert base64 to buffer if needed
    let fileData;
    if (typeof fileBuffer === "string" && fileBuffer.startsWith("data:")) {
      const base64Data = fileBuffer.split(",")[1];
      fileData = Buffer.from(base64Data, "base64");
    } else if (Buffer.isBuffer(fileBuffer)) {
      fileData = fileBuffer;
    } else {
      return res.status(400).json({
        success: false,
        error: "Invalid file format",
      });
    }

    // Ensure uploads directory exists
    const uploadDir = "uploads/converted_files/";
    await fs.ensureDir(uploadDir);

    // Generate unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileExtension = path.extname(originalName) || ".pdf";
    const filename = `converted-${uniqueSuffix}${fileExtension}`;
    const filePath = path.join(uploadDir, filename);

    // Save file to disk
    await fs.writeFile(filePath, fileData);

    // Use the authenticated user's ID from verifyToken middleware
    const uploadedBy = req.user.id;

    // Save file info to database
    const fileRecord = new File({
      filename: filename,
      originalName: originalName,
      path: filePath,
      size: fileData.length,
      mimetype: mimetype || "application/octet-stream",
      uploadedBy: uploadedBy,
      category: "converted",
      toolUsed: toolUsed,
    });

    await fileRecord.save();

    res.json({
      success: true,
      message: "File saved successfully",
      file: {
        _id: fileRecord._id,
        filename: fileRecord.originalName,
        path: fileRecord.path,
        uploadedAt: fileRecord.uploadedAt,
        size: fileRecord.size,
      },
    });
  } catch (error) {
    console.error("Save file error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to save file: " + error.message,
    });
  }
};

// Enhanced delete to handle ALL tools
const deleteFile = async (req, res) => {
  try {
    const fileId = req.params.id;

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: "User authentication required",
      });
    }

    const userId = req.user.id;

    // Try to find and delete from ALL models
    let file = await File.findOne({ _id: fileId, uploadedBy: userId });
    let source = 'convert';

    if (!file) {
      file = await Organize.findOne({ _id: fileId, userId });
      source = 'organize';
    }
    if (!file) {
      file = await Optimize.findOne({ _id: fileId, userId });
      source = 'optimize';
    }
    if (!file) {
      file = await Edit.findOne({ _id: fileId, userId });
      source = 'edit';
    }
    if (!file) {
      file = await Security.findOne({ _id: fileId, userId });
      source = 'security';
    }
    if (!file) {
      file = await Advanced.findOne({ _id: fileId, userId });
      source = 'advanced';
    }

    if (!file) {
      return res.status(404).json({
        success: false,
        error: "File not found",
      });
    }

    // Delete physical file if path exists
    const filePath = file.outputPath || file.path;
    if (filePath) {
      try {
        if (await fs.pathExists(filePath)) {
          await fs.unlink(filePath);
          console.log('✅ Physical file deleted:', filePath);
        }
      } catch (error) {
        console.warn('⚠️ Could not delete physical file:', error.message);
      }
    }

    // Delete database record
    switch (source) {
      case 'convert':
        await File.findByIdAndDelete(fileId);
        break;
      case 'organize':
        await Organize.findByIdAndDelete(fileId);
        break;
      case 'optimize':
        await Optimize.findByIdAndDelete(fileId);
        break;
      case 'edit':
        await Edit.findByIdAndDelete(fileId);
        break;
      case 'security':
        await Security.findByIdAndDelete(fileId);
        break;
      case 'advanced':
        await Advanced.findByIdAndDelete(fileId);
        break;
    }

    res.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error("Delete file error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete file: " + error.message,
    });
  }
};

// Get file statistics from all tools
const getFileStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const [
      convertCount,
      organizeCount,
      optimizeCount,
      editCount,
      securityCount,
      advancedCount
    ] = await Promise.all([
      File.countDocuments({ uploadedBy: userId }),
      Organize.countDocuments({ userId }),
      Optimize.countDocuments({ userId }),
      Edit.countDocuments({ userId }),
      Security.countDocuments({ userId }),
      Advanced.countDocuments({ userId })
    ]);

    const totalFiles = convertCount + organizeCount + optimizeCount + editCount + securityCount + advancedCount;

    res.json({
      success: true,
      stats: {
        convert: convertCount,
        organize: organizeCount,
        optimize: optimizeCount,
        edit: editCount,
        security: securityCount,
        advanced: advancedCount,
        total: totalFiles
      }
    });
  } catch (error) {
    console.error("Get file stats error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get file statistics",
    });
  }
};

module.exports = {
  getUserFiles,     // Now returns ALL tools files
  downloadFile,     // Enhanced to handle ALL tools
  downloadBatchFiles,
  saveConvertedFile, // For convert tools only
  deleteFile,       // Enhanced to handle ALL tools
  getFileStats
};