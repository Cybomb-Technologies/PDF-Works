// models/FileModel.js - COMPLETE REPLACEMENT
const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  path: {
    type: String, 
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  mimetype: {
    type: String,
    required: true,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  category: {
    type: String,
    enum: [
      "converted", 
      "organized", 
      "optimized", 
      "edited", 
      "secured",
      "advanced",
      "uploaded",
      "ocr"
    ],
    default: "converted",
  },
  toolUsed: {
    type: String,
    enum: [
      // Convert tools
      "pdf-to-image", "image-to-pdf", "word-to-pdf", "excel-to-pdf", "ppt-to-pdf", "convert",
      
      // OCR tool
      "ocr-extraction",
      
      // Organize tools
      "merge", "split", "rotate",
      
      // Optimize tools
      "image-optimization", "code-minification", "cache-cleaning",
      
      // Edit tools
      "pdf-edit", "image-crop", "file-rename", "e-signature",
      
      // Security tools
      "encryption", "decryption", "2fa-protection", "file-sharing",
      
      // Advanced tools
      "automation", "api-connect", "analytics"
    ],
    default: "pdf-to-image",
  },
  toolCategory: {
    type: String,
    enum: ["convert", "organize", "optimize", "edit", "security", "advanced"],
    required: true
  },
  metadata: {
    type: Object,
    default: {}
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("File", fileSchema);