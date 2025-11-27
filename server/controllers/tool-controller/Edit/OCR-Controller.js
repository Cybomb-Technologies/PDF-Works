const path = require("path");
const fs = require("fs").promises;
const { createWorker } = require("tesseract.js");
const Edit = require("../../../models/tools-models/Edit/Edit-Model");

// === FIXED USAGE IMPORTS ===
const { checkLimits } = require("../../../utils/checkLimits");
const { incrementUsage } = require("../../../utils/incrementUsage");

class OCRController {
  constructor() {
    console.log("OCRController initialized");
    this.extractText = this.extractText.bind(this);
    this.saveOCR = this.saveOCR.bind(this);
  }

  // Extract text from image using Tesseract.js
  async extractText(req, res) {
    try {
      const userId = req.user?.id;

      // -------------------------------------------------------
      // Usage limit check BEFORE processing - EDIT TOOLS
      // -------------------------------------------------------
      if (userId) {
        try {
          const limitCheck = await checkLimits(userId, "edit-tools");
          console.log("🔍 OCR Limit Check:", {
            allowed: limitCheck.allowed,
            reason: limitCheck.reason,
            currentUsage: limitCheck.usage?.editTools,
            limit: limitCheck.plan?.editToolsLimit,
          });

          if (!limitCheck.allowed) {
            console.log("🚫 OCR blocked - limit exceeded");
            return res.status(200).json({
              success: false,
              type: "limit_exceeded",
              title: limitCheck.title || "Usage Limit Reached",
              message: limitCheck.reason,
              notificationType: "error",
              currentUsage: limitCheck.usage?.editTools || 0,
              limit: limitCheck.plan?.editToolsLimit || 0,
              upgradeRequired: limitCheck.upgradeRequired || true,
            });
          }
        } catch (limitErr) {
          console.error("Limit check error:", limitErr);
          return res.status(200).json({
            success: false,
            type: "limit_exceeded",
            title: "Usage Limit Error",
            message: limitErr.message,
            notificationType: "error",
          });
        }
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No image file provided",
        });
      }

      console.log("OCR processing started for file:", req.file.originalname);

      // Create Tesseract worker
      const worker = await createWorker("eng"); // English by default

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

        // ✅ Increment usage for edit tools AFTER successful OCR
        if (userId) {
          await incrementUsage(userId, "edit-tools");
          console.log("✅ Usage incremented for OCR");
        }

        res.json({
          success: true,
          text: text || "",
          confidence: confidence || 0,
          textLength: text?.length || 0,
          message: "Text extracted successfully",
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

  // Save OCR result to Edit model
  async saveOCR(req, res) {
    try {
      const { originalName, extractedText } = req.body;
      const file = req.file;
      const userId = req.user?.id;

      if (!file) {
        return res.status(400).json({
          success: false,
          error: "No file provided",
        });
      }

      if (!extractedText) {
        return res.status(400).json({
          success: false,
          error: "No extracted text provided",
        });
      }

      // -------------------------------------------------------
      // Usage limit check BEFORE processing - EDIT TOOLS
      // -------------------------------------------------------
      if (userId) {
        try {
          const limitCheck = await checkLimits(userId, "edit-tools");
          console.log("🔍 OCR Save Limit Check:", {
            allowed: limitCheck.allowed,
            reason: limitCheck.reason,
            currentUsage: limitCheck.usage?.editTools,
            limit: limitCheck.plan?.editToolsLimit,
          });

          if (!limitCheck.allowed) {
            return res.status(200).json({
              success: false,
              type: "limit_exceeded",
              title: limitCheck.title || "Usage Limit Reached",
              message: limitCheck.reason,
              notificationType: "error",
              currentUsage: limitCheck.usage?.editTools || 0,
              limit: limitCheck.plan?.editToolsLimit || 0,
              upgradeRequired: limitCheck.upgradeRequired || true,
            });
          }
        } catch (limitErr) {
          console.error("Limit check error:", limitErr);
          return res.status(200).json({
            success: false,
            type: "limit_exceeded",
            title: "Usage Limit Error",
            message: limitErr.message,
            notificationType: "error",
          });
        }
      }

      const uploadsDir = path.join(__dirname, "../../../uploads/edited");
      await fs.mkdir(uploadsDir, { recursive: true });

      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const filename = `ocr-${uniqueSuffix}-${file.originalname}.txt`;
      const filePath = path.join(uploadsDir, filename);

      // Write the extracted text to file
      await fs.writeFile(filePath, extractedText);

      const editRecord = new Edit({
        userId: userId,
        originalFilename: originalName || file.originalname,
        editedFilename: filename,
        originalFileType:
          path.extname(originalName || file.originalname).replace(".", "") ||
          "image",
        editedFileType: "txt",
        editType: "ocr-text",
        fileSize: Buffer.byteLength(extractedText, "utf8"),
        editStatus: "completed",
        downloadUrl: `/api/tools/pdf-editor/download-edited/${filename}`,
        outputPath: filePath,
        editMetadata: {
          textLength: extractedText.length,
          originalFileType: file.mimetype,
          processedAt: new Date().toISOString(),
        },
      });

      await editRecord.save();
      console.log("OCR result saved to Edit model:", editRecord._id);

      // ✅ Increment usage for edit tools AFTER successful save
      if (userId) {
        await incrementUsage(userId, "edit-tools");
        console.log("✅ Usage incremented for OCR save");
      }

      res.json({
        success: true,
        editId: editRecord._id,
        downloadUrl: editRecord.downloadUrl,
        message: "OCR result saved successfully",
      });
    } catch (error) {
      console.error("Save OCR error:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}

const ocrController = new OCRController();
module.exports = ocrController;
