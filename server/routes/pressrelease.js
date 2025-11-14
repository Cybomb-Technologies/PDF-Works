// routes/pressrelease.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const PressRelease = require("../models/PressreleaseModel");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/press-releases/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'press-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileFilter
});

// CREATE (with PDF upload)
router.post("/", upload.single('pdfFile'), async (req, res) => {
  try {
    const { title, description, content, author, category, status, image } = req.body;

    const newPress = new PressRelease({
      title,
      description,
      content,
      author,
      category,
      status,
      image: image || null,
      pdfFile: req.file ? `/uploads/press-releases/${req.file.filename}` : null,
      pdfFileName: req.file ? req.file.originalname : null,
      fileSize: req.file ? req.file.size : null
    });

    await newPress.save();
    res.status(201).json(newPress);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// UPDATE with PDF upload
router.put("/:id", upload.single('pdfFile'), async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    if (req.file) {
      updateData.pdfFile = `/uploads/press-releases/${req.file.filename}`;
      updateData.pdfFileName = req.file.originalname;
      updateData.fileSize = req.file.size;
    }

    const updated = await PressRelease.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Increment download count
router.post("/:id/download", async (req, res) => {
  try {
    const press = await PressRelease.findByIdAndUpdate(
      req.params.id,
      { $inc: { downloadCount: 1 } },
      { new: true }
    );
    res.json({ downloadCount: press.downloadCount });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// READ ALL (existing routes remain the same)
router.get("/", async (req, res) => {
  try {
    const press = await PressRelease.find().sort({ publishedDate: -1 });
    res.json(press);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// READ ONE (existing route remains the same)
router.get("/:id", async (req, res) => {
  try {
    const press = await PressRelease.findById(req.params.id);
    res.json(press);
  } catch (err) {
    res.status(404).json({ message: "Press release not found" });
  }
});

// DELETE (existing route remains the same)
router.delete("/:id", async (req, res) => {
  try {
    await PressRelease.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;