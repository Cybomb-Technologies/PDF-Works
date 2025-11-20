const mongoose = require("mongoose");

const ConvertSchema = new mongoose.Schema(
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
    convertedFilename: {
      type: String,
      required: true,
    },
    originalFileType: {
      type: String,
      required: true,
    },
    convertedFileType: {
      type: String,
      required: true,
    },
    conversionType: {
      type: String,
      required: true,
      enum: [
        "pdf-to-word",
        "pdf-to-excel",
        "pdf-to-ppt",
        "pdf-to-image",
        "image-to-pdf",
        "word-to-pdf",
        "excel-to-pdf",
        "ppt-to-pdf",
        "pdf-optimize",
      ],
    },
    fileSize: {
      type: Number,
      required: true,
    },
    conversionStatus: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "processing",
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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Convert", ConvertSchema);
