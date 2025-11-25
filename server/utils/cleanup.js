const fs = require("fs");
const path = require("path");

const FILE_EXPIRATION = 1 * 60 * 60 * 1000; // 1 hour

// DIRECTORIES SAFE TO DELETE FROM
const deleteFolders = [
  "uploads/temp",
  "uploads/sessions",
  "uploads/security",
  "uploads/conversions",
  "uploads/press-releases",
].map((dir) => path.join(__dirname, "..", dir));

const logFile = path.join(__dirname, "..", "cleanup.log");

const writeCleanupLog = (message) => {
  const timestamp = new Date().toISOString();
  fs.appendFile(logFile, `[${timestamp}] ${message}\n`, (err) => {
    if (err) console.error("❌ Failed to write log:", err);
  });
};

const deleteOldFilesFromDirectory = (directory) => {
  if (!fs.existsSync(directory)) return;

  fs.readdir(directory, (err, files) => {
    if (err) return;

    files.forEach((file) => {
      const filePath = path.join(directory, file);

      fs.stat(filePath, (err, stat) => {
        if (err) return;

        const age = Date.now() - stat.mtimeMs;
        if (age > FILE_EXPIRATION) {
          fs.unlink(filePath, (err) => {
            if (err) {
              console.error(`❌ Failed to delete ${filePath}`);
              writeCleanupLog(`ERROR deleting: ${filePath}`);
            } else {
              console.log(`🗑️ Deleted expired file: ${filePath}`);
              writeCleanupLog(`Deleted: ${filePath}`);
            }
          });
        }
      });
    });
  });
};

const runCleanupTask = () => {
  console.log("🧹 Running hourly cleanup task...");
  writeCleanupLog("🚀 Cleanup task started");
  deleteFolders.forEach(deleteOldFilesFromDirectory);
};

module.exports = {
  runCleanupTask,
};
