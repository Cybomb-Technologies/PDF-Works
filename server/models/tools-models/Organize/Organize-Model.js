// server/models/tools-models/Organize/Organize-Model.js
const mongoose = require("mongoose");

const OrganizeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    originalFilenames: {
      type: [String],
      required: true,
    },
    processedFilename: {
      type: String,
      required: true,
    },
    operationType: {
      type: String,
      required: true,
      enum: ["merge", "split", "rotate"],
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
    operationMetadata: {
      type: Object,
      required: false,
      default: {}
    }
  },
  {
    timestamps: true,
  } 
);

module.exports = mongoose.model("Organize", OrganizeSchema);