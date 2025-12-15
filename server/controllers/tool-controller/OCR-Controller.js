// controllers/tool-controller/OCR-Controller.js
const path = require("path");
const fs = require("fs").promises;
const { createWorker } = require("tesseract.js");
const sharp = require("sharp");
const OCR = require("../../models/tools-models/OCR/OCR");

class OCRController {
  constructor() {
    // console.log("OCRController initialized");
    this.extractText = this.extractText.bind(this);
    this.downloadOCRFile = this.downloadOCRFile.bind(this);
    this.getOCRHistory = this.getOCRHistory.bind(this);
    this.previewOCRText = this.previewOCRText.bind(this);
    this.extractBatchText = this.extractBatchText.bind(this);
    this.extractHandwriting = this.extractHandwriting.bind(this);
  }

  // Save OCR text as a file and record
  async saveOCRFile(fileBuffer, originalFilename, text, userId, metadata = {}) {
    try {
      const uploadsDir = path.join(__dirname, '../../../uploads/ocr');
      await fs.mkdir(uploadsDir, { recursive: true });

      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const baseName = path.parse(originalFilename).name;
      const filename = `ocr - extracted - ${baseName} -${uniqueSuffix}.txt`;
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
        downloadUrl: `/ api / tools / ocr / download / ${filename} `,
        outputPath: filePath,
        ocrMetadata: {
          ...metadata,
          confidence: metadata.confidence || 0,
          textPreview: text?.substring(0, 200) + (text?.length > 200 ? '...' : '')
        }
      });

      await ocrRecord.save();
      // console.log("✅ OCR file saved:", ocrRecord._id);

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
        // console.log("✅ OCR file added to unified File model:", fileRecord._id);
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
      res.setHeader('Content-Disposition', `attachment; filename = "${filename}"`);
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

  // Helper: Preprocess image buffer with Sharp
  async preprocessImage(buffer) {
    try {
      const metadata = await sharp(buffer).metadata();
      let transform = sharp(buffer);
      transform = transform.grayscale();
      if (metadata.width < 1500) {
        transform = transform.resize({ width: Math.min(metadata.width * 2, 3000) });
      }
      transform = transform.sharpen();
      transform = transform.normalize();
      return await transform.png().toBuffer();
    } catch (error) {
      console.warn("⚠️ Image preprocessing failed:", error.message);
      return buffer; // Fallback
    }
  }

  // Extract text from image using Tesseract.js (Reverted to Image Only)
  async extractText(req, res) {
    try {
      const userId = req.user?.id;
      let language = (req.body.language || "eng").trim();

      // Auto-append english for mixed content
      if (language !== "eng" && !language.includes("+")) {
        language = `${language}+eng`;
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No file provided",
        });
      }

      // Check limits
      if (userId) {
        try {
          let checkLimits;
          try {
            const usageLimits = require('../../../utils/checkLimits');
            checkLimits = usageLimits.checkLimits;
          } catch (e) {
            const usageLimits = require('../../utils/checkLimits');
            checkLimits = usageLimits.checkLimits;
          }
          const limitCheck = await checkLimits(userId, 'ocr');
          if (!limitCheck.allowed) {
            return res.status(403).json({ success: false, error: limitCheck.reason, upgradeRequired: limitCheck.upgradeRequired });
          }
        } catch (e) {
          console.warn("⚠️ Usage limits check failed/skipped");
        }
      }

      const worker = await createWorker(language, 1, {
        langPath: path.join(__dirname, '../../trained_datas'),
        cachePath: path.join(__dirname, '../../trained_datas'),
        gzip: false
      });
      let fullText = "";
      let avgConfidence = 0;

      try {
        // --- IMAGE PROCESSING ONLY ---
        // console.log("Processing Image...");
        const processedBuffer = await this.preprocessImage(req.file.buffer);

        const { data: { text, confidence } } = await worker.recognize(processedBuffer);
        fullText = text;
        avgConfidence = confidence;

        await worker.terminate();

        // Save Result
        let ocrRecord = null;
        let savedFile = null;

        if (userId && fullText) {
          try {
            ocrRecord = await this.saveOCRFile(
              req.file.buffer,
              req.file.originalname,
              fullText,
              userId,
              {
                originalSize: req.file.size,
                confidence: avgConfidence,
                language: language,
                processedAt: new Date().toISOString()
              }
            );

            // Increment usage
            try {
              let incrementUsage;
              try {
                const usageLimits = require('../../../utils/checkLimits');
                incrementUsage = usageLimits.incrementUsage;
              } catch (e) {
                const usageLimits = require('../../utils/checkLimits');
                incrementUsage = usageLimits.incrementUsage;
              }
              await incrementUsage(userId, 'ocr');
            } catch (e) { console.warn("Could not increment usage"); }

          } catch (e) { console.error("Failed to save OCR file"); }
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
          text: fullText || "",
          confidence: avgConfidence || 0,
          textLength: fullText?.length || 0,
          message: "Text extracted successfully",
          ocrId: ocrRecord?._id,
          fileId: savedFile?._id,
          language: language,
          downloadUrl: ocrRecord?.downloadUrl,
          previewUrl: ocrRecord?.processedFilename ? `/ api / tools / ocr / preview / ${ocrRecord.processedFilename} ` : null,
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

  // Batch Extract Text
  async extractBatchText(req, res) {
    try {
      const userId = req.user?.id;
      let language = (req.body.language || "eng").trim();

      // Auto-append english for mixed content
      if (language !== "eng" && !language.includes("+")) {
        language = `${language}+eng`;
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: "No files provided",
        });
      }

      // Check limits
      if (userId) {
        try {
          let checkLimits;
          try {
            const usageLimits = require('../../../utils/checkLimits');
            checkLimits = usageLimits.checkLimits;
          } catch (e) {
            const usageLimits = require('../../utils/checkLimits');
            checkLimits = usageLimits.checkLimits;
          }
          const limitCheck = await checkLimits(userId, 'ocr');
          if (!limitCheck.allowed) {
            return res.status(403).json({ success: false, error: limitCheck.reason, upgradeRequired: limitCheck.upgradeRequired });
          }
        } catch (e) {
          console.warn("⚠️ Usage limits check failed/skipped");
        }
      }

      const worker = await createWorker(language, 1, {
        langPath: path.join(__dirname, '../../trained_datas'),
        gzip: false
      });

      let combinedText = "";
      let totalConfidence = 0;
      let processedCount = 0;

      try {
        // Process each file sequentially
        for (const file of req.files) {
          try {
            const processedBuffer = await this.preprocessImage(file.buffer);
            const { data: { text, confidence } } = await worker.recognize(processedBuffer);

            if (text) {
              // Add separator based on user request (line break after each processed OCR)
              // Using a clear separator including filename for clarity
              combinedText += `\n\n--- ${file.originalname} ---\n\n`;
              combinedText += text;
              totalConfidence += confidence;
              processedCount++;
            }
          } catch (fileError) {
            console.error(`Failed to process file ${file.originalname}:`, fileError);
            combinedText += `\n\n--- ${file.originalname} (FAILED) ---\n\nError processing file.\n`;
          }
        }

        await worker.terminate();

        const avgConfidence = processedCount > 0 ? totalConfidence / processedCount : 0;

        // Save Result (Combined)
        let ocrRecord = null;
        let savedFile = null;

        if (userId && combinedText) {
          try {
            // Calculate total size
            const totalSize = req.files.reduce((acc, file) => acc + file.size, 0);

            ocrRecord = await this.saveOCRFile(
              Buffer.alloc(0), // No single original file to save
              `Batch Result - ${new Date().toISOString().replace(/:/g, '-')}.txt`, // Name for the record
              combinedText,
              userId,
              {
                originalSize: totalSize,
                confidence: avgConfidence,
                language: language,
                processedAt: new Date().toISOString(),
                isBatch: true,
                fileCount: req.files.length
              }
            );

            // Increment usage
            try {
              let incrementUsage;
              try {
                const usageLimits = require('../../../utils/checkLimits');
                incrementUsage = usageLimits.incrementUsage;
              } catch (e) {
                const usageLimits = require('../../utils/checkLimits');
                incrementUsage = usageLimits.incrementUsage;
              }
              await incrementUsage(userId, 'ocr');
            } catch (e) { console.warn("Could not increment usage"); }

          } catch (e) { console.error("Failed to save OCR file"); }
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
          text: combinedText || "",
          confidence: avgConfidence || 0,
          textLength: combinedText?.length || 0,
          message: "Batch extraction completed successfully",
          ocrId: ocrRecord?._id,
          fileId: savedFile?._id,
          language: language,
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
      console.error("Batch OCR extraction error:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Handwriting OCR (via Docker Service)
  async extractHandwriting(req, res) {
    try {
      const userId = req.user?.id;

      // Check limits
      if (userId) {
        try {
          let checkLimits;
          try {
            const usageLimits = require('../../../utils/checkLimits');
            checkLimits = usageLimits.checkLimits;
          } catch (e) {
            const usageLimits = require('../../utils/checkLimits');
            checkLimits = usageLimits.checkLimits;
          }
          const limitCheck = await checkLimits(userId, 'ocr');
          if (!limitCheck.allowed) {
            return res.status(403).json({ success: false, error: limitCheck.reason, upgradeRequired: limitCheck.upgradeRequired });
          }
        } catch (e) {
          console.warn("⚠️ Usage limits check failed/skipped");
        }
      }

      if (!req.file) {
        return res.status(400).json({ success: false, error: "No file provided" });
      }

      const ocrServiceUrl = process.env.OCR_SERVICE_URL || "http://localhost:8000";

      // Send to Python Service
      const axios = require('axios');
      const FormData = require('form-data');

      const form = new FormData();
      form.append('file', req.file.buffer, req.file.originalname);

      let ocrResponse;
      try {
        ocrResponse = await axios.post(`${ocrServiceUrl}/ocr`, form, {
          headers: { ...form.getHeaders() },
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        });
      } catch (serviceError) {
        console.error("OCR Service unavailable:", serviceError.message);
        return res.status(503).json({
          success: false,
          error: "Handwriting OCR service is currently unavailable. Please ensure the Docker service is running."
        });
      }

      if (!ocrResponse.data || !ocrResponse.data.success) {
        console.error("OCR Service Failed:", ocrResponse.data);
        return res.status(500).json({
          success: false,
          error: ocrResponse.data?.error || "Handwriting OCR system failed to process the image."
        });
      }

      const { text, confidence } = ocrResponse.data;

      // Save Result
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
              confidence: confidence,
              language: "eng", // Handwriting defaulting to eng for now
              processedAt: new Date().toISOString(),
              isHandwriting: true
            }
          );

          // Increment usage
          try {
            let incrementUsage;
            try {
              const usageLimits = require('../../../utils/checkLimits');
              incrementUsage = usageLimits.incrementUsage;
            } catch (e) {
              const usageLimits = require('../../utils/checkLimits');
              incrementUsage = usageLimits.incrementUsage;
            }
            await incrementUsage(userId, 'ocr');
          } catch (e) { console.warn("Could not increment usage"); }
        } catch (saveError) { console.error("Failed to save OCR file"); }
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
        text: text,
        confidence: confidence,
        message: "Handwriting extracted successfully",
        ocrId: ocrRecord?._id,
        fileId: savedFile?._id,
        downloadUrl: ocrRecord?.downloadUrl,
        previewUrl: ocrRecord?.processedFilename ? `/api/tools/ocr/preview/${ocrRecord.processedFilename}` : null,
      });

    } catch (error) {
      console.error("Handwriting extraction error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

const ocrController = new OCRController();
module.exports = ocrController;