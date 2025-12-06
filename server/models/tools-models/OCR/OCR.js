// models/tools-models/OCR/OCR.js - COMPLETE REPLACEMENT
const mongoose = require("mongoose");

const OCRSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    originalFilename: {
      type: String,
      required: true,
    },
    processedFilename: {
      type: String,
      required: true,
    },
    operationType: {
      type: String,
      required: true,
      enum: ["text-extraction"],
    },
    originalFileSize: {
      type: Number,
      required: false,
    },
    extractedTextLength: {
      type: Number,
      required: false,
    },
    fileSize: {
      type: Number,
      required: false,
    },
    operationStatus: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "completed",
    },
    downloadUrl: {
      type: String,
      required: false,
    },
    outputPath: {
      type: String,
      required: false,
    },
    ocrMetadata: {
      type: Object,
      required: false,
      default: {}
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("OCR", OCRSchema);