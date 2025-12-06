const path = require('path');
const fs = require('fs').promises;
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf');
const { createCanvas } = require('canvas');
const Edit = require("../../../models/tools-models/Edit/Edit-Model");
const archiver = require('archiver');

// ✅ ENHANCED: Import usage tracking functions with TOPUP support
const { checkLimits } = require("../../../utils/checkLimits");
const { incrementUsage } = require("../../../utils/incrementUsage");

// Configure PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = path.join(__dirname, '../../../node_modules/pdfjs-dist/build/pdf.worker.js');

class EditController {
  constructor() {
    console.log('EditController initialized');
    this.configurePDFJS();
    this.uploadPDF = this.uploadPDF.bind(this);
    this.extractPDFStructure = this.extractPDFStructure.bind(this);
    this.getStructure = this.getStructure.bind(this);
    this.updateText = this.updateText.bind(this);
    this.exportPDF = this.exportPDF.bind(this);
    this.serveImage = this.serveImage.bind(this);
    this.applyEdits = this.applyEdits.bind(this);
    this.downloadEdited = this.downloadEdited.bind(this);
    this.renderPageToImage = this.renderPageToImage.bind(this);
    this.serveBackgroundImage = this.serveBackgroundImage.bind(this);
    this.getEdits = this.getEdits.bind(this);
    this.embedCanvasAsPage = this.embedCanvasAsPage.bind(this);
    this.addOriginalPageAsImage = this.addOriginalPageAsImage.bind(this);
    
    // New methods for Edit model
    this.saveToEditModel = this.saveToEditModel.bind(this);
    this.savePdfEdit = this.savePdfEdit.bind(this);
    this.saveImageCrop = this.saveImageCrop.bind(this);
    this.saveFileRename = this.saveFileRename.bind(this);
    this.downloadEditedFile = this.downloadEditedFile.bind(this);
    this.getEditHistory = this.getEditHistory.bind(this);
    this.downloadBatch = this.downloadBatch.bind(this);
  }

  // Configure PDF.js to suppress font warnings
  configurePDFJS() {
    const originalConsoleWarn = console.warn;
    console.warn = function(...args) {
      if (typeof args[0] === 'string' && 
          (args[0].includes('getPathGenerator') || 
           args[0].includes('fetchStandardFontData') ||
           args[0].includes('Requesting object that isn\'t resolved yet'))) {
        return; // Suppress font-related warnings
      }
      originalConsoleWarn.apply(console, args);
    };
  }

  // Save edited file to Edit model (for single files)
  async saveToEditModel(fileBuffer, originalName, editedName, fileType, editType, userId, metadata = {}) {
    try {
      const uploadsDir = path.join(__dirname, '../../../uploads/edited');
      await fs.mkdir(uploadsDir, { recursive: true });

      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const filename = `edited-${uniqueSuffix}-${editedName}`;
      const filePath = path.join(uploadsDir, filename);

      await fs.writeFile(filePath, fileBuffer);

      const editRecord = new Edit({
        userId: userId,
        originalFilename: originalName,
        editedFilename: editedName,
        originalFileType: path.extname(originalName).replace('.', '') || 'unknown',
        editedFileType: path.extname(editedName).replace('.', '') || fileType,
        editType: editType,
        fileSize: fileBuffer.length,
        editStatus: "completed",
        downloadUrl: `/api/tools/pdf-editor/download-edited/${filename}`,
        outputPath: filePath,
        editMetadata: metadata
      });

      await editRecord.save();
      console.log("File saved to Edit model:", editRecord._id);
      return editRecord;
    } catch (error) {
      console.error("Error saving to Edit model:", error);
      throw error;
    }
  }

  // Save PDF Editor output
  async savePdfEdit(req, res) {
    try {
      const { sessionId, originalName, totalPages } = req.body;
      const file = req.file;
      const userId = req.user?.id;

      if (!file) {
        return res.status(400).json({
          success: false,
          error: 'No file provided'
        });
      }

      // -------------------------------------------------------
      // ✅ ENHANCED: Usage limit check WITH TOPUP SUPPORT
      // -------------------------------------------------------
      let creditsInfo = null;
      if (userId) {
        try {
          console.log('🔍 [EDIT DEBUG] Checking limits for user:', userId);
          
          const limitCheck = await checkLimits(userId, "edit-tools");
          creditsInfo = limitCheck.creditsInfo;
          
          console.log('🔍 [EDIT DEBUG] Limit check result:', {
            allowed: limitCheck.allowed,
            reason: limitCheck.reason,
            currentUsage: limitCheck.usage?.editTools,
            limit: limitCheck.plan?.editToolsLimit,
            planName: limitCheck.plan?.name,
            usingTopup: limitCheck.creditsInfo?.usingTopup || false,
            topupAvailable: limitCheck.creditsInfo?.topupAvailable || 0
          });
          
          if (!limitCheck.allowed) {
            return res.status(200).json({
              success: false,
              type: "limit_exceeded",
              title: "Usage Limit Reached",
              message: limitCheck.reason,
              notificationType: "error",
              currentUsage: limitCheck.usage?.editTools || 0,
              limit: limitCheck.plan?.editToolsLimit || 0,
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
        } catch (limitErr) {
          console.error('❌ [EDIT DEBUG] Limit check error:', limitErr);
          return res.status(200).json({
            success: false,
            type: "limit_exceeded",
            title: "Usage Limit Error",
            message: limitErr.message,
            notificationType: "error"
          });
        }
      }

      const editRecord = await this.saveToEditModel(
        file.buffer,
        originalName || 'document.pdf',
        `edited-${sessionId}.pdf`,
        'pdf',
        'pdf-edit',
        userId,
        { sessionId, totalPages: parseInt(totalPages) || 1 }
      );

      // ✅ ENHANCED: Increment usage with topup tracking
      let incrementResult = null;
      if (userId) {
        incrementResult = await incrementUsage(userId, "edit-tools");
        console.log('✅ [EDIT DEBUG] Usage incremented:', {
          userId: userId,
          creditsUsed: incrementResult?.creditsUsed,
          topupRemaining: incrementResult?.creditsUsed?.topupRemaining
        });
      }

      // ✅ ENHANCED: Response with credits information
      const responseData = {
        success: true,
        editId: editRecord._id,
        downloadUrl: editRecord.downloadUrl,
        message: 'PDF edit saved successfully'
      };

      // Add credits info if available
      if (creditsInfo || incrementResult?.creditsUsed) {
        responseData.creditsInfo = {
          ...creditsInfo,
          ...(incrementResult?.creditsUsed && {
            creditsUsed: incrementResult.creditsUsed.total,
            fromPlan: incrementResult.creditsUsed.fromPlan,
            fromTopup: incrementResult.creditsUsed.fromTopup,
            topupRemaining: incrementResult.creditsUsed.topupRemaining,
            planRemaining: creditsInfo ? Math.max(0, creditsInfo.planRemaining - (incrementResult.creditsUsed.fromPlan || 0)) : 0,
            topupAvailable: incrementResult.creditsUsed.topupRemaining || 0
          })
        };
      }

      res.json(responseData);

    } catch (error) {
      console.error('Save PDF edit error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // ✅ ENHANCED: Save Image Crop output with TOPUP SUPPORT
  async saveImageCrop(req, res) {
    try {
      console.log('🔍 [EDIT DEBUG] Save Image Crop called');
      console.log('🔍 [EDIT DEBUG] Body:', req.body);
      console.log('🔍 [EDIT DEBUG] File:', req.file ? `Present - ${req.file.originalname}` : 'Missing');

      const { originalName, cropDimensions } = req.body;
      const file = req.file;
      const userId = req.user?.id;

      // -------------------------------------------------------
      // ✅ ENHANCED: Usage limit check WITH TOPUP SUPPORT
      // -------------------------------------------------------
      let creditsInfo = null;
      if (userId) {
        try {
          console.log('🔍 [EDIT DEBUG] Checking limits for user:', userId);
          
          const limitCheck = await checkLimits(userId, "edit-tools");
          creditsInfo = limitCheck.creditsInfo;
          
          console.log('🔍 [EDIT DEBUG] Image Crop Limit Check:', {
            allowed: limitCheck.allowed,
            reason: limitCheck.reason,
            currentUsage: limitCheck.usage?.editTools,
            limit: limitCheck.plan?.editToolsLimit,
            usingTopup: limitCheck.creditsInfo?.usingTopup || false,
            topupAvailable: limitCheck.creditsInfo?.topupAvailable || 0
          });

          if (!limitCheck.allowed) {
            console.log('🚫 [EDIT DEBUG] Image Crop blocked - limit exceeded');
            return res.status(200).json({
              success: false,
              type: "limit_exceeded",
              title: limitCheck.title || "Usage Limit Reached",
              message: limitCheck.reason,
              notificationType: "error",
              currentUsage: limitCheck.usage?.editTools || 0,
              limit: limitCheck.plan?.editToolsLimit || 0,
              upgradeRequired: limitCheck.upgradeRequired || true,
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
        } catch (limitErr) {
          console.error('❌ [EDIT DEBUG] Limit check error:', limitErr);
          return res.status(200).json({
            success: false,
            type: "limit_exceeded",
            title: "Usage Limit Error",
            message: limitErr.message,
            notificationType: "error"
          });
        }
      }

      // If we reach here, limit check passed - proceed with processing
      if (!file) {
        console.log('❌ [EDIT DEBUG] No file provided in request');
        return res.status(400).json({
          success: false,
          error: 'No file provided'
        });
      }

      // Handle cropDimensions - it might be string or object
      let cropData = {};
      if (cropDimensions) {
        if (typeof cropDimensions === 'string') {
          try {
            cropData = JSON.parse(cropDimensions);
          } catch (parseError) {
            console.warn('Failed to parse cropDimensions as JSON:', parseError);
            // Try to extract basic info
            cropData = { raw: cropDimensions };
          }
        } else if (typeof cropDimensions === 'object') {
          cropData = cropDimensions;
        }
      }

      console.log('🔍 [EDIT DEBUG] Processing crop data:', cropData);

      const editRecord = await this.saveToEditModel(
        file.buffer,
        originalName || file.originalname,
        `cropped-${Date.now()}.png`,
        'png',
        'image-crop',
        userId,
        { cropDimensions: cropData }
      );

      console.log('✅ [EDIT DEBUG] Image crop saved successfully:', editRecord._id);

      // ✅ ENHANCED: Increment usage with topup tracking
      let incrementResult = null;
      if (userId) {
        incrementResult = await incrementUsage(userId, "edit-tools");
        console.log('✅ [EDIT DEBUG] Usage incremented for image crop:', {
          userId: userId,
          creditsUsed: incrementResult?.creditsUsed,
          topupRemaining: incrementResult?.creditsUsed?.topupRemaining
        });
      }

      // ✅ ENHANCED: Response with credits information
      const responseData = {
        success: true,
        editId: editRecord._id,
        downloadUrl: editRecord.downloadUrl,
        message: 'Image crop saved successfully'
      };

      // Add credits info if available
      if (creditsInfo || incrementResult?.creditsUsed) {
        responseData.creditsInfo = {
          ...creditsInfo,
          ...(incrementResult?.creditsUsed && {
            creditsUsed: incrementResult.creditsUsed.total,
            fromPlan: incrementResult.creditsUsed.fromPlan,
            fromTopup: incrementResult.creditsUsed.fromTopup,
            topupRemaining: incrementResult.creditsUsed.topupRemaining,
            planRemaining: creditsInfo ? Math.max(0, creditsInfo.planRemaining - (incrementResult.creditsUsed.fromPlan || 0)) : 0,
            topupAvailable: incrementResult.creditsUsed.topupRemaining || 0
          })
        };
      }

      res.json(responseData);

    } catch (error) {
      console.error('❌ [EDIT DEBUG] Save image crop error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // ✅ ENHANCED: Save File Rename output as BATCH with TOPUP SUPPORT
  async saveFileRename(req, res) {
    try {
      console.log('🔍 [EDIT DEBUG] Save File Rename called with:', {
        body: req.body,
        filesCount: req.files ? req.files.length : 0,
        userId: req.user?.id
      });

      const { filesData, batchName } = req.body;
      const files = req.files || [];
      const userId = req.user?.id;

      // -------------------------------------------------------
      // ✅ ENHANCED: Usage limit check WITH TOPUP SUPPORT
      // -------------------------------------------------------
      let creditsInfo = null;
      if (userId) {
        try {
          console.log('🔍 [EDIT DEBUG] Checking limits for user:', userId);
          
          const limitCheck = await checkLimits(userId, "edit-tools");
          creditsInfo = limitCheck.creditsInfo;
          
          console.log('🔍 [EDIT DEBUG] File Rename Limit Check:', {
            allowed: limitCheck.allowed,
            reason: limitCheck.reason,
            currentUsage: limitCheck.usage?.editTools,
            limit: limitCheck.plan?.editToolsLimit,
            usingTopup: limitCheck.creditsInfo?.usingTopup || false,
            topupAvailable: limitCheck.creditsInfo?.topupAvailable || 0
          });

          if (!limitCheck.allowed) {
            // Delete all uploaded files since we're not processing them
            if (files && files.length > 0) {
              console.log('🚫 [EDIT DEBUG] Limit exceeded, discarding uploaded files');
            }

            return res.status(200).json({
              success: false,
              type: "limit_exceeded",
              title: limitCheck.title || "Usage Limit Reached",
              message: limitCheck.reason,
              notificationType: "error",
              currentUsage: limitCheck.usage?.editTools || 0,
              limit: limitCheck.plan?.editToolsLimit || 0,
              upgradeRequired: limitCheck.upgradeRequired || true,
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
        } catch (limitErr) {
          console.error('❌ [EDIT DEBUG] Limit check error:', limitErr);
          return res.status(200).json({
            success: false,
            type: "limit_exceeded",
            title: "Usage Limit Error",
            message: limitErr.message,
            notificationType: "error"
          });
        }
      }

      if (!files || files.length === 0) {
        console.log('❌ [EDIT DEBUG] No files provided');
        return res.status(400).json({
          success: false,
          error: 'No files provided'
        });
      }

      let filesDataParsed = [];
      try {
        filesDataParsed = filesData ? JSON.parse(filesData) : [];
      } catch (parseError) {
        console.warn('Failed to parse filesData:', parseError);
      }

      // Create batch ID for grouping
      const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('🔍 [EDIT DEBUG] Generated batchId:', batchId);

      const savedRecords = [];
      const batchFiles = [];

      // Process each file and save to disk
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileData = filesDataParsed[i] || {};
        
        const newFilename = fileData.newName || `renamed-${Date.now()}-${file.originalname}`;
        
        // Save file to disk
        const uploadsDir = path.join(__dirname, '../../../uploads/edited');
        await fs.mkdir(uploadsDir, { recursive: true });

        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const filename = `batch-${batchId}-file-${i}-${newFilename}`;
        const filePath = path.join(uploadsDir, filename);

        await fs.writeFile(filePath, file.buffer);

        // Collect file info for batch
        batchFiles.push({
          originalName: fileData.originalName || file.originalname,
          newName: newFilename,
          fileSize: file.buffer.length,
          fileType: path.extname(fileData.originalName || file.originalname).replace('.', '') || 'file',
          downloadUrl: `/api/tools/pdf-editor/download-edited/${filename}`,
          outputPath: filePath,
          fileIndex: i
        });

        savedRecords.push({
          originalName: fileData.originalName || file.originalname,
          newName: newFilename,
          downloadUrl: `/api/tools/pdf-editor/download-edited/${filename}`
        });

        console.log(`✅ [EDIT DEBUG] File processed for batch: ${file.originalname} -> ${newFilename}`);
      }

      // Create SINGLE batch record in database
      const batchRecord = new Edit({
        userId: userId,
        originalFilename: batchName || `File Batch (${files.length} files)`,
        editedFilename: `Renamed Batch (${files.length} files)`,
        originalFileType: 'batch',
        editedFileType: 'batch',
        editType: 'file-rename',
        fileSize: batchFiles.reduce((total, file) => total + file.fileSize, 0),
        editStatus: "completed",
        downloadUrl: `/api/tools/pdf-editor/download-batch/${batchId}`,
        outputPath: '', // Not needed for batches
        editMetadata: {
          batchId: batchId,
          totalFiles: files.length,
          pattern: filesDataParsed[0]?.pattern || 'default',
          files: batchFiles, // Store all file info in metadata
          batchName: batchName || `File Rename Batch ${new Date().toLocaleDateString()}`,
          processedAt: new Date().toISOString()
        }
      });

      await batchRecord.save();
      
      console.log('✅ [EDIT DEBUG] Batch saved successfully:', {
        batchRecordId: batchRecord._id,
        batchId: batchId,
        totalFiles: files.length,
        userId: userId
      });

      // ✅ ENHANCED: Increment usage with topup tracking
      let incrementResult = null;
      if (userId) {
        incrementResult = await incrementUsage(userId, "edit-tools");
        console.log('✅ [EDIT DEBUG] Usage incremented for file rename batch:', {
          userId: userId,
          creditsUsed: incrementResult?.creditsUsed,
          topupRemaining: incrementResult?.creditsUsed?.topupRemaining
        });
      }

      // ✅ ENHANCED: Response with credits information
      const responseData = {
        success: true,
        batchId: batchId,
        editId: batchRecord._id,
        savedRecords: savedRecords,
        message: `Successfully saved ${files.length} files as batch`
      };

      // Add credits info if available
      if (creditsInfo || incrementResult?.creditsUsed) {
        responseData.creditsInfo = {
          ...creditsInfo,
          ...(incrementResult?.creditsUsed && {
            creditsUsed: incrementResult.creditsUsed.total,
            fromPlan: incrementResult.creditsUsed.fromPlan,
            fromTopup: incrementResult.creditsUsed.fromTopup,
            topupRemaining: incrementResult.creditsUsed.topupRemaining,
            planRemaining: creditsInfo ? Math.max(0, creditsInfo.planRemaining - (incrementResult.creditsUsed.fromPlan || 0)) : 0,
            topupAvailable: incrementResult.creditsUsed.topupRemaining || 0
          })
        };
      }

      res.json(responseData);

    } catch (error) {
      console.error('❌ [EDIT DEBUG] Save file rename error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // ✅ ENHANCED: Upload PDF with TOPUP SUPPORT
  async uploadPDF(req, res) {
    console.log('🔍 [EDIT DEBUG] uploadPDF method called');
    try {
      const userId = req.user?.id;
      
      // -------------------------------------------------------
      // ✅ ENHANCED: Usage limit check WITH TOPUP SUPPORT
      // -------------------------------------------------------
      let creditsInfo = null;
      if (userId) {
        try {
          console.log('🔍 [EDIT DEBUG] Checking limits for user:', userId);
          
          const limitCheck = await checkLimits(userId, "edit-tools");
          creditsInfo = limitCheck.creditsInfo;
          
          console.log('🔍 [EDIT DEBUG] PDF Upload Limit Check:', {
            allowed: limitCheck.allowed,
            reason: limitCheck.reason,
            currentUsage: limitCheck.usage?.editTools,
            limit: limitCheck.plan?.editToolsLimit,
            usingTopup: limitCheck.creditsInfo?.usingTopup || false,
            topupAvailable: limitCheck.creditsInfo?.topupAvailable || 0
          });

          if (!limitCheck.allowed) {
            console.log('🚫 [EDIT DEBUG] PDF Upload blocked - limit exceeded');
            return res.status(200).json({
              success: false,
              type: "limit_exceeded",
              title: limitCheck.title || "Usage Limit Reached",
              message: limitCheck.reason,
              notificationType: "error",
              currentUsage: limitCheck.usage?.editTools || 0,
              limit: limitCheck.plan?.editToolsLimit || 0,
              upgradeRequired: limitCheck.upgradeRequired || true,
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
        } catch (limitErr) {
          console.error('❌ [EDIT DEBUG] Limit check error:', limitErr);
          return res.status(200).json({
            success: false,
            type: "limit_exceeded",
            title: "Usage Limit Error",
            message: limitErr.message,
            notificationType: "error"
          });
        }
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
      }

      if (req.file.mimetype !== 'application/pdf') {
        return res.status(400).json({
          success: false,
          error: 'Only PDF files are allowed'
        });
      }

      console.log('✅ [EDIT DEBUG] PDF file received, size:', req.file.size);

      const sessionId = `edit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const sessionDir = path.join(__dirname, '../../../uploads/sessions', sessionId);
      
      await fs.mkdir(sessionDir, { recursive: true });
      console.log('✅ [EDIT DEBUG] Session directory created:', sessionDir);

      const originalFilePath = path.join(sessionDir, 'original.pdf');
      await fs.writeFile(originalFilePath, req.file.buffer);

      // Extract PDF structure and render pages to images
      console.log('🔍 [EDIT DEBUG] Starting PDF processing...');
      const pdfUint8Array = new Uint8Array(req.file.buffer);
      const pdfStructure = await this.extractPDFStructure(pdfUint8Array, sessionId);
      
      // Save structure to file
      const structureFile = path.join(sessionDir, 'structure.json');
      await fs.writeFile(structureFile, JSON.stringify(pdfStructure, null, 2));

      // Render each page to image for background
      for (let pageNum = 1; pageNum <= pdfStructure.pages.length; pageNum++) {
        await this.renderPageToImage(pdfUint8Array, pageNum, sessionId);
      }

      console.log('✅ [EDIT DEBUG] PDF processing completed');

      // ✅ ENHANCED: Increment usage with topup tracking
      let incrementResult = null;
      if (userId) {
        incrementResult = await incrementUsage(userId, "edit-tools");
        console.log('✅ [EDIT DEBUG] Usage incremented for PDF upload:', {
          userId: userId,
          creditsUsed: incrementResult?.creditsUsed,
          topupRemaining: incrementResult?.creditsUsed?.topupRemaining
        });
      }

      // ✅ ENHANCED: Response with credits information
      const responseData = {
        success: true,
        sessionId,
        totalPages: pdfStructure.pages.length,
        structure: pdfStructure,
        message: 'PDF uploaded and processed successfully'
      };

      // Add credits info if available
      if (creditsInfo || incrementResult?.creditsUsed) {
        responseData.creditsInfo = {
          ...creditsInfo,
          ...(incrementResult?.creditsUsed && {
            creditsUsed: incrementResult.creditsUsed.total,
            fromPlan: incrementResult.creditsUsed.fromPlan,
            fromTopup: incrementResult.creditsUsed.fromTopup,
            topupRemaining: incrementResult.creditsUsed.topupRemaining,
            planRemaining: creditsInfo ? Math.max(0, creditsInfo.planRemaining - (incrementResult.creditsUsed.fromPlan || 0)) : 0,
            topupAvailable: incrementResult.creditsUsed.topupRemaining || 0
          })
        };
      }

      res.json(responseData);

    } catch (error) {
      console.error('❌ [EDIT DEBUG] Upload error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  // Download entire batch as ZIP
  async downloadBatch(req, res) {
    try {
      const { batchId } = req.params;
      const userId = req.user?.id;
      
      console.log('🔍 [EDIT DEBUG] Download batch requested:', {
        batchId,
        userId,
        timestamp: new Date().toISOString()
      });

      // Find the batch record
      const batchRecord = await Edit.findOne({ 
        'editMetadata.batchId': batchId,
        editType: 'file-rename'
      });

      console.log('🔍 [EDIT DEBUG] Batch record search result:', {
        found: !!batchRecord,
        batchIdSearched: batchId,
        recordId: batchRecord?._id,
        recordBatchId: batchRecord?.editMetadata?.batchId,
        userId: batchRecord?.userId,
        totalFiles: batchRecord?.editMetadata?.totalFiles
      });

      if (!batchRecord) {
        // Debug: Check what batches exist for this user
        const userBatches = await Edit.find({ 
          userId: userId,
          editType: 'file-rename' 
        });
        
        console.log('🔍 [EDIT DEBUG] All batches for user:', {
          userId,
          totalBatches: userBatches.length,
          batches: userBatches.map(b => ({
            id: b._id,
            batchId: b.editMetadata?.batchId,
            batchName: b.editMetadata?.batchName,
            totalFiles: b.editMetadata?.totalFiles,
            createdAt: b.createdAt
          }))
        });

        return res.status(404).json({
          success: false,
          error: 'Batch not found',
          debug: {
            searchedBatchId: batchId,
            userBatches: userBatches.map(b => b.editMetadata?.batchId),
            userId: userId
          }
        });
      }

      // Check if user owns this batch
      if (batchRecord.userId.toString() !== userId.toString()) {
        console.log('🚫 [EDIT DEBUG] User unauthorized for batch:', {
          batchUserId: batchRecord.userId.toString(),
          requestUserId: userId.toString()
        });
        return res.status(403).json({
          success: false,
          error: 'Unauthorized to access this batch'
        });
      }

      // Check if files exist
      const existingFiles = [];
      const missingFiles = [];
      
      for (const fileInfo of batchRecord.editMetadata.files) {
        try {
          await fs.access(fileInfo.outputPath);
          existingFiles.push(fileInfo);
        } catch (error) {
          console.warn(`❌ [EDIT DEBUG] File not found: ${fileInfo.outputPath}`);
          missingFiles.push(fileInfo.outputPath);
        }
      }

      console.log('🔍 [EDIT DEBUG] File check results:', {
        totalFiles: batchRecord.editMetadata.files.length,
        existingFiles: existingFiles.length,
        missingFiles: missingFiles.length,
        missingFilePaths: missingFiles
      });

      if (existingFiles.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'No files found in batch',
          debug: {
            totalFiles: batchRecord.editMetadata.files.length,
            missingFiles: missingFiles.length
          }
        });
      }

      // Create ZIP file containing all batch files
      const zip = archiver('zip', { 
        zlib: { level: 9 } 
      });

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="file-batch-${batchId}.zip"`);

      zip.pipe(res);

      // Add each file to the ZIP
      for (const fileInfo of existingFiles) {
        console.log(`📦 [EDIT DEBUG] Adding to ZIP: ${fileInfo.newName} -> ${fileInfo.outputPath}`);
        zip.file(fileInfo.outputPath, { name: fileInfo.newName });
      }

      zip.on('error', (err) => {
        console.error('❌ [EDIT DEBUG] ZIP creation error:', err);
        res.status(500).json({
          success: false,
          error: 'Failed to create ZIP file'
        });
      });

      zip.on('end', () => {
        console.log('✅ [EDIT DEBUG] ZIP creation completed successfully');
      });

      await zip.finalize();

      console.log(`✅ [EDIT DEBUG] Batch ZIP downloaded: ${batchId} with ${existingFiles.length} files`);

    } catch (error) {
      console.error('❌ [EDIT DEBUG] Download batch error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Download edited file (individual files from batch)
  async downloadEditedFile(req, res) {
    try {
      const { filename } = req.params;

      const filePath = path.join(__dirname, '../../../uploads/edited', filename);

      try {
        await fs.access(filePath);
      } catch {
        return res.status(404).json({
          success: false,
          error: 'File not found'
        });
      }

      const fileBuffer = await fs.readFile(filePath);
      const fileType = path.extname(filename).toLowerCase().replace('.', '');

      res.setHeader('Content-Type', this.getMimeType(fileType));
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(fileBuffer);

    } catch (error) {
      console.error('Download edited file error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get user's edit history
  async getEditHistory(req, res) {
    try {
      const userId = req.user.id;
      
      const edits = await Edit.find({ userId })
        .sort({ createdAt: -1 })
        .limit(50);

      // Format response to show batch info
      const formattedEdits = edits.map(edit => ({
        _id: edit._id,
        originalFilename: edit.originalFilename,
        editedFilename: edit.editedFilename,
        editType: edit.editType,
        fileSize: edit.fileSize,
        createdAt: edit.createdAt,
        downloadUrl: edit.downloadUrl,
        isBatch: edit.editType === 'file-rename',
        batchInfo: edit.editType === 'file-rename' ? {
          totalFiles: edit.editMetadata?.totalFiles || 0,
          batchId: edit.editMetadata?.batchId,
          batchName: edit.editMetadata?.batchName
        } : null
      }));

      res.json({
        success: true,
        edits: formattedEdits
      });

    } catch (error) {
      console.error('Get edit history error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Helper function to get MIME type
  getMimeType(fileType) {
    const mimeTypes = {
      pdf: "application/pdf",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      txt: "text/plain",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ppt: "application/vnd.ms-powerpoint",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    };

    return mimeTypes[fileType.toLowerCase()] || "application/octet-stream";
  }

  // Extract PDF structure with precise coordinates
  async extractPDFStructure(pdfBuffer, sessionId) {
    console.log('extractPDFStructure called');
    
    const structure = {
      pages: [],
      metadata: {},
      fonts: {},
      images: {}
    };

    try {
      const pdfDoc = await pdfjsLib.getDocument({ data: pdfBuffer }).promise;
      console.log('PDF loaded, pages:', pdfDoc.numPages);

      const metadata = await pdfDoc.getMetadata();
      structure.metadata = metadata.info || {};

      for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        console.log(`Processing page ${pageNum}...`);
        
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.0 });
        
        const [textContent, annotations] = await Promise.all([
          page.getTextContent(),
          page.getAnnotations().catch(() => [])
        ]);

        const pageStructure = {
          pageNumber: pageNum,
          width: viewport.width,
          height: viewport.height,
          viewport: {
            width: viewport.width,
            height: viewport.height,
            scale: viewport.scale
          },
          backgroundImage: `/api/tools/pdf-editor/background/${sessionId}/page-${pageNum}.png`,
          elements: {
            text: [],
            images: [],
            annotations: []
          }
        };

        // Extract text elements with precise positioning
        const textElements = this.extractTextElements(textContent, viewport, pageNum);
        pageStructure.elements.text = textElements;

        // Extract annotations
        const annotationElements = this.extractAnnotations(annotations, viewport, pageNum);
        pageStructure.elements.annotations = annotationElements;

        structure.pages.push(pageStructure);

        console.log(`Page ${pageNum} processed:`, {
          text: textElements.length,
          annotations: annotationElements.length
        });
      }

      await pdfDoc.destroy();
      return structure;

    } catch (error) {
      console.error('Error extracting PDF structure:', error);
      throw error;
    }
  }

  // Extract text elements with exact positioning - FIXED COORDINATES
  extractTextElements(textContent, viewport, pageNum) {
    const textElements = [];

    textContent.items.forEach((item, index) => {
      const transform = item.transform;
      
      // FIXED: Calculate precise position using PDF coordinate system
      // PDF has origin at bottom-left, DOM has origin at top-left
      const x = transform[4];
      const y = viewport.height - transform[5] - (item.height || 12);
      
      const textElement = {
        id: `text-${pageNum}-${index}`,
        type: 'text',
        content: item.str,
        originalContent: item.str,
        page: pageNum,
        position: {
          x: x,
          y: y,
          width: item.width || 100,
          height: item.height || 12
        },
        style: {
          fontSize: item.height || 12,
          fontFamily: item.fontName || 'Arial, sans-serif',
          fontWeight: this.getFontWeight(item),
          color: this.getTextColor(item),
          textAlign: 'left',
          lineHeight: 1,
          whiteSpace: 'pre'
        },
        transform: item.transform
      };

      textElements.push(textElement);
    });

    return textElements;
  }

  // Get font weight from font name
  getFontWeight(item) {
    if (!item.fontName) return 'normal';
    const fontName = item.fontName.toLowerCase();
    if (fontName.includes('bold') || fontName.includes('black')) return 'bold';
    if (fontName.includes('light') || fontName.includes('thin')) return 'lighter';
    return 'normal';
  }

  // Extract text color
  getTextColor(item) {
    if (item.color && item.color !== 'rgba(0, 0, 0, 1)') {
      return this.rgbToHex(item.color);
    }
    return '#000000';
  }

  // Convert RGB to Hex
  rgbToHex(rgb) {
    if (Array.isArray(rgb)) {
      const [r, g, b] = rgb.map(c => Math.round(c * 255));
      return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }
    return '#000000';
  }

  // Extract annotations
  extractAnnotations(annotations, viewport, pageNum) {
    return annotations.map((annotation, index) => ({
      id: `annotation-${pageNum}-${index}`,
      type: 'annotation',
      content: annotation.contents || '',
      page: pageNum,
      position: {
        x: annotation.rect[0],
        y: viewport.height - annotation.rect[3],
        width: annotation.rect[2] - annotation.rect[0],
        height: annotation.rect[3] - annotation.rect[1]
      },
      annotationType: annotation.subtype
    }));
  }

  // Render page to image for background
  async renderPageToImage(pdfBuffer, pageNum, sessionId) {
    try {
      const pdfDoc = await pdfjsLib.getDocument({ data: pdfBuffer }).promise;
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better quality
      
      const canvas = createCanvas(viewport.width, viewport.height);
      const context = canvas.getContext('2d');
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      
      await page.render(renderContext).promise;
      
      // Save the image
      const sessionDir = path.join(__dirname, '../../../uploads/sessions', sessionId);
      const imagePath = path.join(sessionDir, `page-${pageNum}.png`);
      
      const buffer = canvas.toBuffer('image/png');
      await fs.writeFile(imagePath, buffer);
      
      await page.cleanup();
      await pdfDoc.destroy();
      
      console.log(`Rendered page ${pageNum} to image`);
      
    } catch (error) {
      console.error(`Error rendering page ${pageNum} to image:`, error);
    }
  }

  // Serve background images
  async serveBackgroundImage(req, res) {
    try {
      const { sessionId, pageNum } = req.params;
      
      const imagePath = path.join(
        __dirname, 
        '../../../uploads/sessions', 
        sessionId, 
        `page-${pageNum}.png`
      );
      
      // Check if image exists
      try {
        await fs.access(imagePath);
      } catch {
        return res.status(404).json({ error: 'Background image not found' });
      }
      
      const imageBuffer = await fs.readFile(imagePath);
      
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(imageBuffer);
      
    } catch (error) {
      console.error('Serve background image error:', error);
      res.status(500).send('Error serving background image');
    }
  }

  // Get PDF structure for specific session
  async getStructure(req, res) {
    try {
      const { sessionId } = req.params;
      
      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: 'Session ID missing'
        });
      }

      const filePath = path.join(
        __dirname,
        '../../../uploads/sessions',
        sessionId,
        'original.pdf'
      );

      const fileBuffer = await fs.readFile(filePath);
      const pdfUint8Array = new Uint8Array(fileBuffer);
      const structure = await this.extractPDFStructure(pdfUint8Array, sessionId);

      res.json({
        success: true,
        structure
      });

    } catch (error) {
      console.error('Get structure error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Update text content
  async updateText(req, res) {
    try {
      const { sessionId, elementId, newContent } = req.body;
      
      if (!sessionId || !elementId) {
        return res.status(400).json({
          success: false,
          error: 'Session ID and element ID are required'
        });
      }

      // Save edits to session file
      const sessionDir = path.join(__dirname, '../../../uploads/sessions', sessionId);
      const editsFile = path.join(sessionDir, 'edits.json');
      
      let edits = { text: {}, elements: {} };
      try {
        const editsData = await fs.readFile(editsFile, 'utf8');
        edits = JSON.parse(editsData);
      } catch (error) {
        // File doesn't exist yet
      }
      
      edits.text[elementId] = newContent;
      await fs.writeFile(editsFile, JSON.stringify(edits, null, 2));

      res.json({
        success: true,
        message: 'Text updated successfully'
      });

    } catch (error) {
      console.error('Update text error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get saved edits
  async getEdits(req, res) {
    try {
      const { sessionId } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: 'Session ID missing'
        });
      }

      const sessionDir = path.join(__dirname, '../../../uploads/sessions', sessionId);
      const editsFile = path.join(sessionDir, 'edits.json');
      
      let edits = { text: {}, elements: {} };
      try {
        const editsData = await fs.readFile(editsFile, 'utf8');
        edits = JSON.parse(editsData);
      } catch (error) {
        // File doesn't exist yet, return empty edits
      }

      res.json({
        success: true,
        edits
      });

    } catch (error) {
      console.error('Get edits error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Enhanced exportPDF method for canvas-only export
  async exportPDF(req, res) {
    try {
      const { sessionId, canvasData, exportMode } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: 'Session ID missing'
        });
      }

      const sessionDir = path.join(__dirname, '../../../uploads/sessions', sessionId);
      const exportFilePath = path.join(sessionDir, 'exported.pdf');

      // Create a new PDF document
      const pdfDoc = await PDFDocument.create();
      
      // Load structure to get page dimensions
      const structureFile = path.join(sessionDir, 'structure.json');
      let structure = null;
      try {
        const structureData = await fs.readFile(structureFile, 'utf8');
        structure = JSON.parse(structureData);
      } catch (error) {
        console.log('No structure file found');
        return res.status(400).json({
          success: false,
          error: 'PDF structure not found'
        });
      }

      console.log(`Exporting ${structure.pages.length} pages in ${exportMode || 'canvas-only'} mode`);

      // Process each page
      for (let pageNum = 1; pageNum <= structure.pages.length; pageNum++) {
        const pageIndex = pageNum - 1;
        const pageStructure = structure.pages[pageIndex];
        
        if (!pageStructure) continue;

        // Create a page with the same dimensions as original
        const page = pdfDoc.addPage([pageStructure.width, pageStructure.height]);
        
        // Check if we have canvas data for this page
        const pageCanvasData = canvasData && canvasData[pageNum];
        
        if (pageCanvasData && pageCanvasData.dataURL) {
          // Use ONLY the canvas data (no original PDF background)
          await this.embedCanvasAsPage(page, pageCanvasData.dataURL, pageStructure.width, pageStructure.height);
          console.log(`Page ${pageNum}: Used canvas-only data`);
        } else {
          // Fallback: white background with message
          page.drawRectangle({
            x: 0,
            y: 0,
            width: pageStructure.width,
            height: pageStructure.height,
            color: rgb(1, 1, 1),
          });
          
          // Add a message indicating no canvas data
          const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
          page.drawText('No canvas data available for this page', {
            x: 50,
            y: pageStructure.height / 2,
            size: 12,
            font: font,
            color: rgb(0.5, 0.5, 0.5),
          });
          
          console.log(`Page ${pageNum}: Used fallback (no canvas data)`);
        }
      }

      const pdfBytes = await pdfDoc.save();
      await fs.writeFile(exportFilePath, pdfBytes);

      console.log('PDF exported successfully with canvas-only rendering');
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=edited-document.pdf');
      res.send(Buffer.from(pdfBytes));

    } catch (error) {
      console.error('Export PDF error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Embed canvas as entire page
  async embedCanvasAsPage(page, dataURL, width, height) {
    try {
      if (!dataURL || !dataURL.startsWith('data:image')) {
        console.warn('Invalid canvas data URL');
        return;
      }

      const base64Data = dataURL.split(',')[1];
      if (!base64Data) {
        console.warn('No base64 data in canvas data URL');
        return;
      }

      const imageBuffer = Buffer.from(base64Data, 'base64');
      const pdfDoc = page.doc;
      
      let image;
      if (dataURL.includes('image/png')) {
        image = await pdfDoc.embedPng(imageBuffer);
      } else if (dataURL.includes('image/jpeg') || dataURL.includes('image/jpg')) {
        image = await pdfDoc.embedJpg(imageBuffer);
      } else {
        console.warn('Unsupported image type for canvas');
        return;
      }
      
      // Draw the canvas image as the entire page background
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: width,
        height: height,
      });
      
    } catch (error) {
      console.error('Error embedding canvas as page:', error);
      // Fallback: white background
      page.drawRectangle({
        x: 0,
        y: 0,
        width: width,
        height: height,
        color: rgb(1, 1, 1),
      });
    }
  }

  // Fallback: Use original page as image
  async addOriginalPageAsImage(pdfDoc, page, sessionId, pageNum, pageStructure) {
    try {
      const sessionDir = path.join(__dirname, '../../../uploads/sessions', sessionId);
      const backgroundPath = path.join(sessionDir, `page-${pageNum}.png`);
      
      if (await fs.access(backgroundPath).then(() => true).catch(() => false)) {
        const backgroundBuffer = await fs.readFile(backgroundPath);
        const backgroundImage = await pdfDoc.embedPng(backgroundBuffer);
        page.drawImage(backgroundImage, {
          x: 0,
          y: 0,
          width: pageStructure.width,
          height: pageStructure.height,
        });
        console.log(`Used background image for page ${pageNum}`);
      } else {
        console.log(`No background image available for page ${pageNum}`);
        // Draw white background as fallback
        page.drawRectangle({
          x: 0,
          y: 0,
          width: pageStructure.width,
          height: pageStructure.height,
          color: rgb(1, 1, 1),
        });
      }
    } catch (error) {
      console.log('Could not load background image for page', pageNum, error.message);
      // Draw white background as final fallback
      page.drawRectangle({
        x: 0,
        y: 0,
        width: pageStructure.width,
        height: pageStructure.height,
        color: rgb(1, 1, 1),
      });
    }
  }

  // Apply edits
  async applyEdits(req, res) {
    try {
      const { sessionId, edits } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: 'Session ID missing'
        });
      }

      const sessionDir = path.join(__dirname, '../../../uploads/sessions', sessionId);
      const editsFile = path.join(sessionDir, 'edits.json');
      
      await fs.writeFile(editsFile, JSON.stringify(edits, null, 2));

      res.json({
        success: true,
        message: 'Edits applied successfully'
      });

    } catch (error) {
      console.error('Apply edits error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Download edited PDF
  async downloadEdited(req, res) {
    try {
      const { sessionId } = req.params;
      
      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: 'Session ID missing'
        });
      }

      const sessionDir = path.join(__dirname, '../../../uploads/sessions', sessionId);
      const exportedFilePath = path.join(sessionDir, 'exported.pdf');

      try {
        await fs.access(exportedFilePath);
      } catch (error) {
        return res.status(404).json({
          success: false,
          error: 'No edited PDF found. Please export first.'
        });
      }

      const fileBuffer = await fs.readFile(exportedFilePath);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=edited-document.pdf');
      res.send(fileBuffer);

    } catch (error) {
      console.error('Download error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Serve images
  async serveImage(req, res) {
    try {
      const { sessionId, pageNum, imageId } = req.params;
      
      // Placeholder implementation
      const placeholderSvg = '<svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#F3F4F6"/><path d="M30 30H70M70 30V70M70 70H30M30 70V30" stroke="#8D8" stroke-width="2"/><text x="50" y="85" text-anchor="middle" fill="#999" font-size="12">Image</text></svg>';
      
      res.setHeader('Content-Type', 'image/svg+xml');
      res.send(placeholderSvg);

    } catch (error) {
      console.error('Serve image error:', error);
      res.status(500).send('Error serving image');
    }
  }

  // ✅ NEW: Get user's edit credits info
  async getUserEditCredits(req, res) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(200).json({
          success: false,
          type: "auth_error",
          title: "Authentication Required",
          message: "Not authenticated",
          notificationType: "error"
        });
      }

      const userId = req.user.id;
      const User = require("../../../models/UserModel");
      const user = await User.findById(userId);
      const limitCheck = await checkLimits(userId, "edit-tools");
      
      const planLimit = limitCheck.plan?.editToolsLimit || 0;
      const currentUsage = limitCheck.usage?.editTools || 0;
      const topupCredits = user?.topupCredits?.editTools || 0;
      const planCreditsLeft = Math.max(0, planLimit - currentUsage);
      const totalAvailable = planLimit + topupCredits;
      const usingTopup = planCreditsLeft <= 0;
      
      res.json({
        success: true,
        credits: {
          plan: {
            limit: planLimit,
            used: currentUsage,
            remaining: planCreditsLeft
          },
          topup: {
            available: topupCredits,
            used: user?.topupUsage?.editTools || 0
          },
          total: {
            available: totalAvailable,
            remaining: Math.max(0, totalAvailable - currentUsage)
          },
          usingTopup: usingTopup,
          nextReset: user?.usage?.resetDate || null
        },
        canEdit: currentUsage < totalAvailable || totalAvailable === 99999
      });
    } catch (error) {
      console.error('Get user edit credits error:', error);
      res.status(200).json({
        success: false,
        type: "server_error",
        title: "Failed to load credits",
        message: error.message,
        notificationType: "error"
      });
    }
  }
}

const editController = new EditController();
module.exports = editController;