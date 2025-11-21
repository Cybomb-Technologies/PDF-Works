// server/models/tools-models/Optimize/Optimize.js
const mongoose = require("mongoose");

const OptimizeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    originalFilename: {
      type: String,
      required: false,
    },
    processedFilename: {
      type: String,
      required: false,
    }, 
    operationType: {
      type: String,
      required: true,
      enum: ["image-optimization", "code-minification", "cache-cleaning"],
    },
    fileSize: {
      type: Number,
      required: false,
    },
    optimizedFileSize: {
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
    optimizeMetadata: {
      type: Object,
      required: false,
      default: {}
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Optimize", OptimizeSchema);