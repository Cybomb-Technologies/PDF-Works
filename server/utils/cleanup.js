const fs = require("fs");
const path = require("path");

// 📌 DB Models
const Security = require("../models/tools-models/Security/Security-Model");
const Organize = require("../models/tools-models/Organize/Organize-Model");
const Optimize = require("../models/tools-models/Optimize/Optimize");
const OCR = require("../models/tools-models/OCR/OCR");
const Edit = require("../models/tools-models/Edit/Edit-Model");
const Convert = require("../models/tools-models/Convert/Convert");
const Advanced = require("../models/tools-models/Advanced/Advanced-Model");

// 🕒 Retention Times (from .env)
const SECURITY_RETENTION = (process.env.SECURITY_RETENTION_DAYS || 30) * 24 * 60 * 60 * 1000;
const OTHER_RETENTION = (process.env.OTHER_RETENTION_HOURS || 24) * 60 * 60 * 1000;
const TEMP_RETENTION = (process.env.TEMP_RETENTION_HOURS || 2) * 60 * 60 * 1000;

// 📁 Base Paths
const basePath = path.join(__dirname, "..", "uploads");

const folders = {
  security: path.join(basePath, "security"),
  securityTemp: path.join(basePath, "security-temp"),
  temp: path.join(basePath, "temp"),
  sessions: path.join(basePath, "sessions"),
  organizeTemp: path.join(basePath, "organize-temp"),
  conversions: path.join(basePath, "conversions"),
  convertedFiles: path.join(basePath, "converted_files"),
  edited: path.join(basePath, "edited"),
  optimize: path.join(basePath, "optimize"),
  ocr: path.join(basePath, "ocr"),
  organized: path.join(basePath, "organized"),
  pressReleases: path.join(basePath, "press-releases"),
};

// 📝 Logging
const logFile = path.join(__dirname, "..", "cleanup.log");
const log = (msg) => fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`);

// 🧹 Delete File or Folder Safely
const removeFile = (filePath) => {
  if (!filePath || !fs.existsSync(filePath)) return;

  try {
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      fs.rmSync(filePath, { recursive: true, force: true });
      log(`🗑️ Deleted folder: ${filePath}`);
    } else {
      fs.unlinkSync(filePath);
      log(`🗑️ Deleted file: ${filePath}`);
    }
  } catch (err) {
    log(`❌ Failed to delete: ${filePath} → ${err.message}`);
  }
};

// 🔐 Delete Security Tool Files (30 Days)
const cleanSecurityFiles = async () => {
  const oldFiles = await Security.find({
    createdAt: { $lt: new Date(Date.now() - SECURITY_RETENTION) },
  });

  for (const file of oldFiles) {
    removeFile(file.outputPath);
    await Security.findByIdAndDelete(file._id);
    log(`♻️ Deleted Security DB record: ${file.processedFilename}`);
  }
};

// ⚙️ Delete Other Tool Files (24 Hrs)
const otherModels = [Organize, Optimize, OCR, Edit, Convert, Advanced];

const cleanOtherToolFiles = async () => {
  for (const model of otherModels) {
    const oldFiles = await model.find({
      createdAt: { $lt: new Date(Date.now() - OTHER_RETENTION) },
    });

    for (const file of oldFiles) {
      removeFile(file.outputPath);
      await model.findByIdAndDelete(file._id);
      log(`🧹 Deleted ${model.collection.name} record: ${file.processedFilename || file.convertedFilename || file.editedFilename}`);
    }
  }
};

// 🧽 Clean Temporary Files (2 Hrs)
const cleanTempFiles = () => {
  const tempFolders = [folders.securityTemp, folders.temp, folders.sessions, folders.organizeTemp];

  tempFolders.forEach((folder) => {
    if (!fs.existsSync(folder)) return;
    fs.readdir(folder, (err, files) => {
      if (err) return;
      files.forEach((file) => {
        const filePath = path.join(folder, file);
        fs.stat(filePath, (err, stat) => {
          if (!err && Date.now() - stat.mtimeMs > TEMP_RETENTION) {
            removeFile(filePath);
          }
        });
      });
    });
  });
};

// 🗂 Extra Cleanup for Regular Folders (24 Hrs)
const cleanOtherFolders = () => {
  const list = [folders.conversions, folders.convertedFiles, folders.edited, folders.optimize, folders.ocr, folders.organized, folders.pressReleases];

  list.forEach((folder) => {
    if (!fs.existsSync(folder)) return;
    fs.readdir(folder, (err, files) => {
      if (err) return;
      files.forEach((file) => {
        const filePath = path.join(folder, file);
        fs.stat(filePath, (err, stat) => {
          if (!err && Date.now() - stat.mtimeMs > OTHER_RETENTION) {
            removeFile(filePath);
          }
        });
      });
    });
  });
};

// 🚀 Run All Cleanup Jobs
const runCleanup = async () => {
  log("🚀 Cleanup Started");

  await cleanSecurityFiles();
  await cleanOtherToolFiles();
  cleanTempFiles();
  cleanOtherFolders();

  log("✔️ Cleanup Completed");
};

module.exports = { runCleanup };
