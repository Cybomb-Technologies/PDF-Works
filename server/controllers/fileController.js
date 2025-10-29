const File = require("../models/FileModel");
const fs = require("fs-extra");
const path = require("path");

// Save converted file
const saveConvertedFile = async (req, res) => {
  try {
    const {
      originalName,
      fileBuffer,
      mimetype,
      toolUsed = "convert",
    } = req.body;

    if (!fileBuffer || !originalName) {
      return res.status(400).json({
        success: false,
        error: "File buffer and original name are required",
      });
    }

    // Check if user is authenticated (using your verifyToken middleware)
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: "User authentication required",
      });
    }

    // Convert base64 to buffer if needed
    let fileData;
    if (typeof fileBuffer === "string" && fileBuffer.startsWith("data:")) {
      // Base64 data URL
      const base64Data = fileBuffer.split(",")[1];
      fileData = Buffer.from(base64Data, "base64");
    } else if (Buffer.isBuffer(fileBuffer)) {
      fileData = fileBuffer;
    } else {
      return res.status(400).json({
        success: false,
        error: "Invalid file format",
      });
    }

    // Ensure uploads directory exists
    const uploadDir = "uploads/converted_files/";
    await fs.ensureDir(uploadDir);

    // Generate unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileExtension = path.extname(originalName) || ".pdf";
    const filename = `converted-${uniqueSuffix}${fileExtension}`;
    const filePath = path.join(uploadDir, filename);

    // Save file to disk
    await fs.writeFile(filePath, fileData);

    // Use the authenticated user's ID from verifyToken middleware
    const uploadedBy = req.user.id;

    // Save file info to database
    const fileRecord = new File({
      filename: filename,
      originalName: originalName,
      path: filePath,
      size: fileData.length,
      mimetype: mimetype || "application/octet-stream",
      uploadedBy: uploadedBy,
      category: "converted",
      toolUsed: toolUsed,
    });

    await fileRecord.save();

    res.json({
      success: true,
      message: "File saved successfully",
      file: {
        _id: fileRecord._id,
        filename: fileRecord.originalName,
        path: fileRecord.path,
        uploadedAt: fileRecord.uploadedAt,
        size: fileRecord.size,
      },
    });
  } catch (error) {
    console.error("Save file error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to save file: " + error.message,
    });
  }
};

// Get user files
const getUserFiles = async (req, res) => {
  try {
    // Check if user is authenticated (using your verifyToken middleware)
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: "User authentication required",
      });
    }

    // Use the authenticated user's ID from verifyToken middleware
    const userId = req.user.id;

    const userFiles = await File.find({ uploadedBy: userId })
      .sort({ uploadedAt: -1 })
      .select("filename originalName path size uploadedAt category toolUsed");

    const formattedFiles = userFiles.map((file) => ({
      _id: file._id,
      filename: file.originalName,
      path: file.path.replace(/\\/g, "/"), // Ensure forward slashes for web
      uploadedAt: file.uploadedAt,
      size: file.size,
      category: file.category,
      toolUsed: file.toolUsed,
    }));

    res.json(formattedFiles);
  } catch (error) {
    console.error("Get files error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch files: " + error.message,
    });
  }
};

// Delete file
const deleteFile = async (req, res) => {
  try {
    const fileId = req.params.id;

    // Check if user is authenticated (using your verifyToken middleware)
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: "User authentication required",
      });
    }

    // Use the authenticated user's ID from verifyToken middleware
    const userId = req.user.id;

    const file = await File.findOne({ _id: fileId, uploadedBy: userId });
    if (!file) {
      return res.status(404).json({
        success: false,
        error: "File not found",
      });
    }

    // Delete physical file
    if (await fs.pathExists(file.path)) {
      await fs.unlink(file.path);
    }

    // Delete database record
    await File.findByIdAndDelete(fileId);

    res.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error("Delete file error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete file: " + error.message,
    });
  }
};

module.exports = {
  saveConvertedFile,
  getUserFiles,
  deleteFile,
};
