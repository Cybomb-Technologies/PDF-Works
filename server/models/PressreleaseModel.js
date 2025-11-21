// models/PressreleaseModel.js
const mongoose = require("mongoose");

const pressreleaseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  content: { type: String },
  image: { type: String }, // For thumbnail/preview image
  pdfFile: { type: String }, // PDF file URL/path
  pdfFileName: { type: String }, // Original PDF file name
  fileSize: { type: Number }, // File size in bytes
  author: { type: String, default: "Admin" },
  category: { type: String, default: "General" },
  publishedDate: { type: Date, default: Date.now },
  status: { type: String, enum: ["draft", "published"], default: "published" },
  downloadCount: { type: Number, default: 0 } // Track downloads
});

module.exports = mongoose.model("PressRelease", pressreleaseSchema);