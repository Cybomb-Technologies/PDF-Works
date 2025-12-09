// server/models/tools-models/Security/Security-Model.js
const mongoose = require("mongoose");

const SecuritySchema = new mongoose.Schema(
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
      enum: ["encryption", "decryption", "2fa-protection", "2fa-access", "file-sharing", "access-grant"],
    },
    fileSize: {
      type: Number,
      required: true,
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
    securityMetadata: {
      type: Object,
      required: false,
      default: {}
    }
  },
  {
    timestamps: true,
  } 
);

module.exports = mongoose.model("Security", SecuritySchema);