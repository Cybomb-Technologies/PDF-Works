// controllers/tool-controller/OCR-Controller.js - COMPLETE REPLACEMENT
const path = require("path");
const fs = require("fs").promises;
const { createWorker } = require("tesseract.js");
const OCR = require("../../models/tools-models/OCR/OCR");

class OCRController {
  constructor() {
    console.log("OCRController initialized");
    this.extractText = this.extractText.bind(this);
    this.downloadOCRFile = this.downloadOCRFile.bind(this);
    this.getOCRHistory = this.getOCRHistory.bind(this);
    this.previewOCRText = this.previewOCRText.bind(this);
  }

  // Save OCR text as a file and record
  async saveOCRFile(fileBuffer, originalFilename, text, userId, metadata = {}) {
    try {
      const uploadsDir = path.join(__dirname, '../../../uploads/ocr');
      await fs.mkdir(uploadsDir, { recursive: true });

      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const baseName = path.parse(originalFilename).name;
      const filename = `ocr-extracted-${baseName}-${uniqueSuffix}.txt`;
      const filePath = path.join(uploadsDir, filename);
      
      // Convert text to buffer and save as file
      const textBuffer = Buffer.from(text || '', 'utf8');
      await fs.writeFile(filePath, textBuffer);

      // Create OCR record in database
      const ocrRecord = new OCR({
        userId: userId,
        originalFilename: originalFilename,
        processedFilename: filename,
        operationType: "text-extraction",
        originalFileSize: metadata.originalSize || fileBuffer.length,
        extractedTextLength: text?.length || 0,
        fileSize: textBuffer.length,
        operationStatus: "completed",
        downloadUrl: `/api/tools/ocr/download/${filename}`,
        outputPath: filePath,
        ocrMetadata: {
          ...metadata,
          confidence: metadata.confidence || 0,
          language: 'eng',
          textPreview: text?.substring(0, 200) + (text?.length > 200 ? '...' : '')
        }
      });

      await ocrRecord.save();
      console.log("✅ OCR file saved:", ocrRecord._id);
      
      // Also save to the unified File model for the Files page
      try {
        const File = require("../../models/FileModel");
        const fileRecord = new File({
          filename: filename,
          originalName: originalFilename,
          path: filePath,
          size: textBuffer.length,
          mimetype: "text/plain",
          uploadedBy: userId,
          category: "ocr",
          toolUsed: "ocr-extraction",
          toolCategory: "convert"
        });
        
        await fileRecord.save();
        console.log("✅ OCR file added to unified File model:", fileRecord._id);
      } catch (fileError) {
        console.warn("⚠️ Could not save to File model:", fileError.message);
      }

      return ocrRecord;
    } catch (error) {
      console.error("❌ Error saving OCR file:", error);
      throw error;
    }
  }

  // Download OCR file
  async downloadOCRFile(req, res) {
    try {
      const { filename } = req.params;
      const filePath = path.join(__dirname, '../../../uploads/ocr', filename);

      try {
        await fs.access(filePath);
      } catch {
        return res.status(404).json({
          success: false,
          error: 'File not found'
        });
      }

      const fileBuffer = await fs.readFile(filePath);
      
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(fileBuffer);

    } catch (error) {
      console.error('Download OCR file error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Preview OCR text (returns text content directly)
  async previewOCRText(req, res) {
    try {
      const { filename } = req.params;
      const filePath = path.join(__dirname, '../../../uploads/ocr', filename);

      try {
        await fs.access(filePath);
      } catch {
        return res.status(404).json({
          success: false,
          error: 'File not found'
        });
      }

      const text = await fs.readFile(filePath, 'utf-8');
      
      res.json({
        success: true,
        filename: filename,
        text: text,
        length: text.length
      });

    } catch (error) {
      console.error('Preview OCR text error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get user's OCR history
  async getOCRHistory(req, res) {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      const ocrOps = await OCR.find({ userId })
        .sort({ createdAt: -1 })
        .limit(50);

      res.json({
        success: true,
        ocrOps
      });

    } catch (error) {
      console.error('Get OCR history error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Extract text from image using Tesseract.js
  async extractText(req, res) {
    try {
      const userId = req.user?.id;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No image file provided",
        });
      }

      // Check if user has OCR access in their plan
      if (userId) {
        try {
          // Try different import paths
          let checkLimits;
          try {
            const usageLimits = require('../../../utils/checkLimits');
            checkLimits = usageLimits.checkLimits;
          } catch (error) {
            const usageLimits = require('../../utils/checkLimits');
            checkLimits = usageLimits.checkLimits;
          }
          
          const limitCheck = await checkLimits(userId, 'ocr');
          
          if (!limitCheck.allowed) {
            return res.status(403).json({
              success: false,
              error: limitCheck.reason,
              upgradeRequired: limitCheck.upgradeRequired
            });
          }
        } catch (error) {
          console.warn("⚠️ Usage limits module not found, proceeding without plan checks");
        }
      }

      console.log("OCR processing started for file:", req.file.originalname);

      // Create Tesseract worker
      const worker = await createWorker("eng");
      try {
        // Perform OCR
        const {
          data: { text, confidence },
        } = await worker.recognize(req.file.buffer);

        await worker.terminate();

        console.log("OCR completed:", {
          textLength: text?.length || 0,
          confidence: confidence,
          fileName: req.file.originalname,
        });

        // ✅ Save OCR text as a file
        let ocrRecord = null;
        let savedFile = null;
        
        if (userId && text) {
          try {
            ocrRecord = await this.saveOCRFile(
              req.file.buffer,
              req.file.originalname,
              text,
              userId,
              {
                originalSize: req.file.size,
                textLength: text?.length || 0,
                confidence: confidence,
                language: 'eng',
                processedAt: new Date().toISOString()
              }
            );

            // ✅ INCREMENT OCR USAGE
            try {
              let incrementUsage;
              try {
                const usageLimits = require('../../../utils/checkLimits');
                incrementUsage = usageLimits.incrementUsage;
              } catch (error) {
                const usageLimits = require('../../utils/checkLimits');
                incrementUsage = usageLimits.incrementUsage;
              }
              await incrementUsage(userId, 'ocr');
            } catch (usageError) {
              console.warn("⚠️ Could not increment usage:", usageError);
            }
          } catch (saveError) {
            console.error("Failed to save OCR file:", saveError);
          }
        }

        // Get the File record if it exists
        if (ocrRecord?.outputPath) {
          try {
            const File = require("../../models/FileModel");
            savedFile = await File.findOne({ path: ocrRecord.outputPath });
          } catch (error) {
            console.warn("Could not fetch saved file record:", error.message);
          }
        }

        res.json({
          success: true,
          text: text || "",
          confidence: confidence || 0,
          textLength: text?.length || 0,
          message: "Text extracted successfully",
          ocrId: ocrRecord?._id,
          fileId: savedFile?._id,
          downloadUrl: ocrRecord?.downloadUrl,
          previewUrl: ocrRecord?.processedFilename ? `/api/tools/ocr/preview/${ocrRecord.processedFilename}` : null,
          fileInfo: {
            filename: ocrRecord?.processedFilename,
            size: ocrRecord?.fileSize,
            path: ocrRecord?.outputPath
          }
        });
      } catch (ocrError) {
        await worker.terminate();
        throw ocrError;
      }
    } catch (error) {
      console.error("OCR extraction error:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      }); 
    }
  }
}

const ocrController = new OCRController();
module.exports = ocrController;