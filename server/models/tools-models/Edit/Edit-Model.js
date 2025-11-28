// server/models/tools-models/Edit/Edit-Model.js
const mongoose = require("mongoose");

const EditSchema = new mongoose.Schema(
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
    editedFilename: {
      type: String,
      required: true,
    },
    originalFileType: {
      type: String,
      required: true,
    },
    editedFileType: {
      type: String,
      required: true,
    },
    editType: {
      type: String,
      required: true,
      enum: [
        "pdf-edit",
        "image-crop",
        "file-rename",
        "e-signature",
        "ocr-text", // Added OCR type
      ],
    },
    fileSize: {
      type: Number,
      required: true,
    },
    editStatus: {
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
    errorMessage: {
      type: String,
      required: false,
    },
    sessionId: {
      type: String,
      required: false,
    },
    editMetadata: {
      type: Object,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Edit", EditSchema);
