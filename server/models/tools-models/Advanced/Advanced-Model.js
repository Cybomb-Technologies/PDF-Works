// server/models/tools-models/Advanced/Advanced-Model.js
const mongoose = require("mongoose");

const AdvancedSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    featureType: {
      type: String,
      enum: ["automation", "api-connect", "analytics"],
      required: true,
    },
    originalName: {
      type: String,
      required: false,
    },
    processedName: {
      type: String,
      required: false,
    },
    operationType: {
      type: String,
      required: true,
      enum: ["automation-run", "api-call", "analytics-view"],
    },
    inputData: { 
      type: Object,
      required: false 
    },
    resultData: { 
      type: Object,
      required: false 
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
    advancedMetadata: {
      type: Object,
      required: false,
      default: {}
    }
  },
  { 
    timestamps: true,
  }
);

module.exports = mongoose.model("Advanced", AdvancedSchema);