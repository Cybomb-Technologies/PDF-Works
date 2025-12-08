// server/controllers/tool-controller/Security/Security-Controller.js
const crypto = require("crypto");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const fs = require("fs").promises;
const path = require("path");
const Security = require("../../../models/tools-models/Security/Security-Model");

// ✅ ENHANCED: Import usage tracking functions with TOPUP support
const { checkLimits } = require("../../../utils/checkLimits");
const { incrementUsage } = require("../../../utils/incrementUsage");

// In-memory storage
let encryptedFiles = new Map();
let twoFactorProtectedFiles = new Map();
let fileAccessMap = new Map();

// Save security operation to Security model
const saveToSecurityModel = async (
  fileBuffer,
  originalFilename,
  processedFilename,
  operationType,
  userId,
  metadata = {}
) => {
  try {
    const uploadsDir = path.join(__dirname, "../../../uploads/security");
    await fs.mkdir(uploadsDir, { recursive: true });

    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename = `security-${uniqueSuffix}-${processedFilename}`;
    const filePath = path.join(uploadsDir, filename);

    await fs.writeFile(filePath, fileBuffer);

    const securityRecord = new Security({
      userId: userId,
      originalFilename: originalFilename,
      processedFilename: processedFilename,
      operationType: operationType,
      fileSize: fileBuffer.length,
      operationStatus: "completed",
      downloadUrl: `/api/tools/security/download/${filename}`,
      outputPath: filePath,
      securityMetadata: metadata,
    });

    await securityRecord.save();
    // console.log(
    //   "✅ Security operation saved to Security model:",
    //   securityRecord._id
    // );
    return securityRecord;
  } catch (error) {
    console.error("❌ Error saving to Security model:", error);
    throw error;
  }
};

// Download security file
const downloadSecurityFile = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, "../../../uploads/security", filename);

    try {
      await fs.access(filePath);
    } catch {
      return res.status(200).json({
        success: false,
        type: "not_found",
        title: "File Not Found",
        message: "File not found",
        notificationType: "error",
      });
    }

    const fileBuffer = await fs.readFile(filePath);
    const fileExtension = path
      .extname(filename)
      .toLowerCase()
      .replace(".", "");

    const mimeTypes = {
      pdf: "application/pdf",
      enc: "application/octet-stream",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      txt: "text/plain",
    };

    const contentType = mimeTypes[fileExtension] || "application/octet-stream";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(fileBuffer);
  } catch (error) {
    console.error("Download security file error:", error);
    res.status(200).json({
      success: false,
      type: "server_error",
      title: "Download Failed",
      message: error.message,
      notificationType: "error",
    });
  }
};

// Get user's security history
const getSecurityHistory = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(200).json({
        success: false,
        type: "auth_error",
        title: "Authentication Required",
        message: "User not authenticated",
        notificationType: "error",
      });
    }

    const securityOps = await Security.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      securityOps,
    });
  } catch (error) {
    console.error("Get security history error:", error);
    res.status(200).json({
      success: false,
      type: "server_error",
      title: "History Error",
      message: error.message,
      notificationType: "error",
    });
  }
};

const generateRandomPassword = (length = 16) => {
  return crypto.randomBytes(length).toString("hex");
};

const encryptBuffer = (buffer, password) => {
  const algorithm = "aes-256-cbc";
  const key = crypto.scryptSync(password, "salt", 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  return Buffer.concat([iv, cipher.update(buffer), cipher.final()]);
};

const decryptBuffer = (buffer, password) => {
  try {
    const algorithm = "aes-256-cbc";
    const key = crypto.scryptSync(password, "salt", 32);
    const iv = buffer.slice(0, 16);
    const encryptedData = buffer.slice(16);
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    return Buffer.concat([decipher.update(encryptedData), decipher.final()]);
  } catch (error) {
    throw new Error("Decryption failed - invalid password or corrupted file");
  }
};

// ✅ NEW: Get user's security credits info
const getUserSecurityCredits = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(200).json({
        success: false,
        type: "auth_error",
        title: "Authentication Required",
        message: "Not authenticated",
        notificationType: "error",
      });
    }

    const userId = req.user.id;
    const User = require("../../../models/UserModel");
    const user = await User.findById(userId);
    const limitCheck = await checkLimits(userId, "security-tools");

    const planLimit = limitCheck.plan?.securityToolsLimit || 0;
    const currentUsage = limitCheck.usage?.securityTools || 0;
    const topupCredits = user?.topupCredits?.securityTools || 0;
    const planCreditsLeft = Math.max(0, planLimit - currentUsage);
    const totalAvailable = planLimit + topupCredits;
    const usingTopup = planCreditsLeft <= 0;

    res.json({
      success: true,
      credits: {
        plan: {
          limit: planLimit,
          used: currentUsage,
          remaining: planCreditsLeft,
        },
        topup: {
          available: topupCredits,
          used: user?.topupUsage?.securityTools || 0,
        },
        total: {
          available: totalAvailable,
          remaining: Math.max(0, totalAvailable - currentUsage),
        },
        usingTopup: usingTopup,
        nextReset: user?.usage?.resetDate || null,
      },
      canUseSecurity:
        currentUsage < totalAvailable || totalAvailable === 99999,
    });
  } catch (error) {
    console.error("Get user security credits error:", error);
    res.status(200).json({
      success: false,
      type: "server_error",
      title: "Failed to load credits",
      message: error.message,
      notificationType: "error",
    });
  }
};

const SecurityController = {
  // File Encryption - DISK STORAGE + PLAN FILE-SIZE CHECK
  encryptFile: async (req, res) => {
    let tempPath = null;

    try {
      //console.log("🔍 [SECURITY DEBUG] Encrypt file request received");
      const userId = req.user?.id;
      let creditsInfo = null;

      if (!req.file) {
        return res.status(200).json({
          success: false,
          type: "validation_error",
          title: "File Required",
          message: "No file uploaded. Please select a file.",
          notificationType: "warning",
        });
      }

      tempPath = req.file.path;
      const fileSizeBytes = req.file.size || 0;

      // ✅ PLAN + TOPUP LIMIT CHECK WITH FILE SIZE
      if (userId) {
        try {
          // console.log(
          //   "🔍 [SECURITY DEBUG] Checking limits for user (encrypt):",
          //   userId
          // );

          const limitCheck = await checkLimits(
            userId,
            "security-tools",
            fileSizeBytes
          );
          creditsInfo = limitCheck.creditsInfo;

          // console.log("🔍 [SECURITY DEBUG] Security Limit Check:", {
          //   allowed: limitCheck.allowed,
          //   reason: limitCheck.reason,
          //   currentUsage: limitCheck.usage?.securityTools,
          //   limit: limitCheck.plan?.securityToolsLimit,
          // });

          if (!limitCheck.allowed) {
            return res.status(200).json({
              success: false,
              type: "limit_exceeded",
              title: limitCheck.title || "Usage Limit Reached",
              message: limitCheck.reason,
              notificationType: "error",
              currentUsage: limitCheck.usage?.securityTools || 0,
              limit: limitCheck.plan?.securityToolsLimit || 0,
              upgradeRequired: limitCheck.upgradeRequired || true,
            });
          }
        } catch (limitErr) {
          console.error("❌ [SECURITY DEBUG] Limit check error:", limitErr);
          return res.status(200).json({
            success: false,
            type: "limit_exceeded",
            title: "Usage Limit Error",
            message: limitErr.message,
            notificationType: "error",
          });
        }
      }

      const uploadedBuffer = await fs.readFile(tempPath);

      const useRandomPassword = req.body.useRandomPassword === "true";
      let password = req.headers["password"];

      if (useRandomPassword && !password) {
        password = generateRandomPassword();
      }

      if (!password) {
        return res.status(200).json({
          success: false,
          type: "validation_error",
          title: "Password Required",
          message: "Password is required for encryption",
          notificationType: "warning",
        });
      }

      const encryptedBuffer = encryptBuffer(uploadedBuffer, password);
      const fileId = crypto.randomBytes(16).toString("hex");

      encryptedFiles.set(fileId, {
        originalName: req.file.originalname,
        encryptedData: encryptedBuffer,
        password: password,
        createdAt: new Date().toISOString(),
      });

      // Save to Security model if user is authenticated
      let securityRecord = null;
      let incrementResult = null;

      if (userId) {
        try {
          securityRecord = await saveToSecurityModel(
            encryptedBuffer,
            req.file.originalname,
            `encrypted-${req.file.originalname}.enc`,
            "encryption",
            userId,
            {
              fileId: fileId,
              useRandomPassword: useRandomPassword,
              algorithm: "AES-256-CBC",
              processedAt: new Date().toISOString(),
            }
          );

          incrementResult = await incrementUsage(userId, "security-tools");
          // console.log("✅ [SECURITY DEBUG] Usage incremented for encryption:", {
          //   userId: userId,
          //   creditsUsed: incrementResult?.creditsUsed,
          //   topupRemaining: incrementResult?.creditsUsed?.topupRemaining,
          // });
        } catch (saveError) {
          console.error("Failed to save to Security model:", saveError);
        }
      }

      // ✅ Simple file download response
      res.setHeader("Content-Type", "application/octet-stream");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="encrypted_${req.file.originalname}.enc"`
      );
      res.setHeader("X-File-ID", fileId);

      if (useRandomPassword) {
        res.setHeader("X-Generated-Password", password);
      }

      if (securityRecord) {
        res.setHeader("X-Security-Id", securityRecord._id.toString());
        res.setHeader("X-Download-Url", securityRecord.downloadUrl);
        res.setHeader("X-File-Saved", "true");
      }

      res.send(encryptedBuffer);
    } catch (error) {
      console.error("❌ Encryption error:", error);
      res.status(200).json({
        success: false,
        type: "encryption_error",
        title: "Encryption Failed",
        message: "Encryption failed: " + error.message,
        notificationType: "error",
      });
    } finally {
      if (tempPath) {
        fs.unlink(tempPath).catch(() => {});
      }
    }
  },

  // File Decryption - DISK STORAGE + PLAN FILE-SIZE CHECK
  decryptFile: async (req, res) => {
    let tempPath = null;

    try {
     // console.log("🔍 [SECURITY DEBUG] Decrypt file request received");
      const userId = req.user?.id;
      let creditsInfo = null;

      if (!req.file) {
        return res.status(200).json({
          success: false,
          type: "validation_error",
          title: "File Required",
          message: "No file uploaded",
          notificationType: "warning",
        });
      }

      tempPath = req.file.path;
      const fileSizeBytes = req.file.size || 0;

      // ✅ PLAN + TOPUP LIMIT CHECK WITH FILE SIZE
      if (userId) {
        try {
          // console.log(
          //   "🔍 [SECURITY DEBUG] Checking limits for user (decrypt):",
          //   userId
          // );

          const limitCheck = await checkLimits(
            userId,
            "security-tools",
            fileSizeBytes
          );
          creditsInfo = limitCheck.creditsInfo;

          // console.log("🔍 [SECURITY DEBUG] Security Limit Check:", {
          //   allowed: limitCheck.allowed,
          //   reason: limitCheck.reason,
          //   currentUsage: limitCheck.usage?.securityTools,
          //   limit: limitCheck.plan?.securityToolsLimit,
          // });

          if (!limitCheck.allowed) {
            return res.status(200).json({
              success: false,
              type: "limit_exceeded",
              title: limitCheck.title || "Usage Limit Reached",
              message: limitCheck.reason,
              notificationType: "error",
              currentUsage: limitCheck.usage?.securityTools || 0,
              limit: limitCheck.plan?.securityToolsLimit || 0,
              upgradeRequired: limitCheck.upgradeRequired || true,
            });
          }
        } catch (limitErr) {
          console.error("❌ [SECURITY DEBUG] Limit check error:", limitErr);
          return res.status(200).json({
            success: false,
            type: "limit_exceeded",
            title: "Usage Limit Error",
            message: limitErr.message,
            notificationType: "error",
          });
        }
      }

      const encryptedBuffer = await fs.readFile(tempPath);

      const password = req.headers["password"];

      if (!password) {
        return res.status(200).json({
          success: false,
          type: "validation_error",
          title: "Password Required",
          message: "Password is required for decryption",
          notificationType: "warning",
        });
      }

      const decryptedBuffer = decryptBuffer(encryptedBuffer, password);
      let originalName = "decrypted_file";

      if (req.file.originalname.endsWith(".enc")) {
        originalName = req.file.originalname.slice(0, -4);
      }

      // Save to Security model if user is authenticated
      let securityRecord = null;
      let incrementResult = null;

      if (userId) {
        try {
          securityRecord = await saveToSecurityModel(
            decryptedBuffer,
            req.file.originalname,
            `decrypted-${originalName}`,
            "decryption",
            userId,
            {
              algorithm: "AES-256-CBC",
              processedAt: new Date().toISOString(),
            }
          );

          incrementResult = await incrementUsage(userId, "security-tools");
          // console.log("✅ [SECURITY DEBUG] Usage incremented for decryption:", {
          //   userId: userId,
          //   creditsUsed: incrementResult?.creditsUsed,
          //   topupRemaining: incrementResult?.creditsUsed?.topupRemaining,
          // });
        } catch (saveError) {
          console.error("Failed to save to Security model:", saveError);
        }
      }

      res.setHeader("Content-Type", "application/octet-stream");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${originalName}"`
      );

      if (securityRecord) {
        res.setHeader("X-Security-Id", securityRecord._id.toString());
        res.setHeader("X-Download-Url", securityRecord.downloadUrl);
        res.setHeader("X-File-Saved", "true");
      }

      res.send(decryptedBuffer);
    } catch (error) {
      console.error("❌ Decryption error:", error);
      res.status(200).json({
        success: false,
        type: "decryption_error",
        title: "Decryption Failed",
        message: error.message,
        notificationType: "error",
      });
    } finally {
      if (tempPath) {
        fs.unlink(tempPath).catch(() => {});
      }
    }
  },

  // Protect PDF with 2FA - DISK STORAGE + PLAN FILE-SIZE CHECK
  protectPDFWith2FA: async (req, res) => {
    let tempPath = null;

    try {
     // console.log("🔍 [SECURITY DEBUG] Protect PDF with 2FA request received");
      const userId = req.user?.id;
      let creditsInfo = null;

      if (!req.file) {
        return res.status(200).json({
          success: false,
          type: "validation_error",
          title: "File Required",
          message: "No PDF file uploaded",
          notificationType: "warning",
        });
      }

      tempPath = req.file.path;
      const fileSizeBytes = req.file.size || 0;

      if (!req.file.mimetype.includes("pdf")) {
        return res.status(200).json({
          success: false,
          type: "validation_error",
          title: "Invalid File Type",
          message: "Only PDF files are supported for 2FA protection",
          notificationType: "warning",
        });
      }

      if (!req.body.identifier) {
        return res.status(200).json({
          success: false,
          type: "validation_error",
          title: "Identifier Required",
          message: "Identifier is required",
          notificationType: "warning",
        });
      }

      // ✅ PLAN + TOPUP LIMIT CHECK WITH FILE SIZE
      if (userId) {
        try {
          // console.log(
          //   "🔍 [SECURITY DEBUG] Checking limits for user (2FA protect):",
          //   userId
          // );

          const limitCheck = await checkLimits(
            userId,
            "security-tools",
            fileSizeBytes
          );
          creditsInfo = limitCheck.creditsInfo;

          // console.log("🔍 [SECURITY DEBUG] Security Limit Check:", {
          //   allowed: limitCheck.allowed,
          //   reason: limitCheck.reason,
          //   currentUsage: limitCheck.usage?.securityTools,
          //   limit: limitCheck.plan?.securityToolsLimit,
          // });

          if (!limitCheck.allowed) {
            return res.status(200).json({
              success: false,
              type: "limit_exceeded",
              title: limitCheck.title || "Usage Limit Reached",
              message: limitCheck.reason,
              notificationType: "error",
              currentUsage: limitCheck.usage?.securityTools || 0,
              limit: limitCheck.plan?.securityToolsLimit || 0,
              upgradeRequired: limitCheck.upgradeRequired || true,
            });
          }
        } catch (limitErr) {
          console.error("❌ [SECURITY DEBUG] Limit check error:", limitErr);
          return res.status(200).json({
            success: false,
            type: "limit_exceeded",
            title: "Usage Limit Error",
            message: limitErr.message,
            notificationType: "error",
          });
        }
      }

      const fileBuffer = await fs.readFile(tempPath);

      const secret = speakeasy.generateSecret({
        name: `ProtectedPDF (${req.body.identifier})`,
        issuer: "SecurePDF",
        length: 20,
      });

      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
      const fileId = crypto.randomBytes(16).toString("hex");

      twoFactorProtectedFiles.set(fileId, {
        originalName: req.file.originalname,
        fileData: fileBuffer,
        secret: secret.base32,
        identifier: req.body.identifier,
        createdAt: new Date().toISOString(),
      });

      // Save to Security model if user is authenticated
      let securityRecord = null;
      let incrementResult = null;

      if (userId) {
        try {
          securityRecord = await saveToSecurityModel(
            fileBuffer,
            req.file.originalname,
            `2fa-protected-${req.file.originalname}`,
            "2fa-protection",
            userId,
            {
              fileId: fileId,
              identifier: req.body.identifier,
              secretKey: secret.base32,
              qrCodeGenerated: true,
              processedAt: new Date().toISOString(),
            }
          );

          incrementResult = await incrementUsage(userId, "security-tools");
          // console.log(
          //   "✅ [SECURITY DEBUG] Usage incremented for 2FA protection:",
          //   {
          //     userId: userId,
          //     creditsUsed: incrementResult?.creditsUsed,
          //     topupRemaining: incrementResult?.creditsUsed?.topupRemaining,
          //   }
          // );
        } catch (saveError) {
          console.error("Failed to save to Security model:", saveError);
        }
      }

      const responseData = {
        success: true,
        type: "2fa_protection_success",
        title: "2FA Protection Successful",
        message: "PDF protected with 2FA successfully.",
        notificationType: "success",
        fileId: fileId,
        secret: secret.base32,
        qrCode: qrCodeUrl,
        securityId: securityRecord?._id,
        downloadUrl: securityRecord?.downloadUrl || null,
      };

      res.json(responseData);
    } catch (error) {
      console.error("❌ 2FA Protection error:", error);
      res.status(200).json({
        success: false,
        type: "2fa_protection_error",
        title: "2FA Protection Failed",
        message: "Failed to protect PDF with 2FA: " + error.message,
        notificationType: "error",
      });
    } finally {
      if (tempPath) {
        fs.unlink(tempPath).catch(() => {});
      }
    }
  },

  // Access 2FA Protected PDF - (no file upload here, so no file-size limit)
  access2FAProtectedPDF: async (req, res) => {
    try {
     // console.log("🔍 [SECURITY DEBUG] Access 2FA PDF request received");
      const userId = req.user?.id;
      let creditsInfo = null;

      const { fileId, token } = req.body;

      if (!fileId || !token) {
        return res.status(200).json({
          success: false,
          type: "validation_error",
          title: "Missing Information",
          message: "File ID and 2FA token are required",
          notificationType: "warning",
        });
      }

      // ✅ Here we don't pass fileSizeBytes (0) because there's no upload
      if (userId) {
        try {
          // console.log(
          //   "🔍 [SECURITY DEBUG] Checking limits for user (2FA access):",
          //   userId
          // );

          const limitCheck = await checkLimits(
            userId,
            "security-tools",
            0 // no new upload here
          );
          creditsInfo = limitCheck.creditsInfo;

          if (!limitCheck.allowed) {
            return res.status(200).json({
              success: false,
              type: "limit_exceeded",
              title: limitCheck.title || "Usage Limit Reached",
              message: limitCheck.reason,
              notificationType: "error",
              currentUsage: limitCheck.usage?.securityTools || 0,
              limit: limitCheck.plan?.securityToolsLimit || 0,
              upgradeRequired: limitCheck.upgradeRequired || true,
            });
          }
        } catch (limitErr) {
          console.error("❌ [SECURITY DEBUG] Limit check error:", limitErr);
          return res.status(200).json({
            success: false,
            type: "limit_exceeded",
            title: "Usage Limit Error",
            message: limitErr.message,
            notificationType: "error",
          });
        }
      }

      const fileData = twoFactorProtectedFiles.get(fileId);
      if (!fileData) {
        return res.status(200).json({
          success: false,
          type: "not_found",
          title: "File Not Found",
          message: "Protected file not found",
          notificationType: "error",
        });
      }

      const verified = speakeasy.totp.verify({
        secret: fileData.secret,
        encoding: "base32",
        token: token,
        window: 1,
      });

      if (!verified) {
        return res.status(200).json({
          success: false,
          type: "authentication_error",
          title: "Invalid Token",
          message: "Invalid 2FA token",
          notificationType: "error",
        });
      }

      // Save to Security model if user is authenticated
      let securityRecord = null;
      let incrementResult = null;

      if (userId) {
        try {
          securityRecord = await saveToSecurityModel(
            fileData.fileData,
            fileData.originalName,
            `accessed-${fileData.originalName}`,
            "2fa-access",
            userId,
            {
              protectedFileId: fileId,
              identifier: fileData.identifier,
              tokenVerified: true,
              processedAt: new Date().toISOString(),
            }
          );

          incrementResult = await incrementUsage(userId, "security-tools");
          // console.log("✅ [SECURITY DEBUG] Usage incremented for 2FA access:", {
          //   userId: userId,
          //   creditsUsed: incrementResult?.creditsUsed,
          //   topupRemaining: incrementResult?.creditsUsed?.topupRemaining,
          // });
        } catch (saveError) {
          console.error("Failed to save to Security model:", saveError);
        }
      }

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileData.originalName}"`
      );

      if (securityRecord) {
        res.setHeader("X-Security-Id", securityRecord._id.toString());
        res.setHeader("X-Download-Url", securityRecord.downloadUrl);
        res.setHeader("X-File-Saved", "true");
      }

      res.send(fileData.fileData);
    } catch (error) {
      console.error("❌ 2FA PDF access error:", error);
      res.status(200).json({
        success: false,
        type: "2fa_access_error",
        title: "Access Failed",
        message: "Failed to access protected PDF: " + error.message,
        notificationType: "error",
      });
    }
  },

  // Share file with access control - DISK STORAGE + PLAN FILE-SIZE CHECK
  shareFileWithAccess: async (req, res) => {
    let tempPath = null;

    try {
     // console.log("🔍 [SECURITY DEBUG] Share file request received");
      const userId = req.user?.id;
      let creditsInfo = null;

      if (!req.file) {
        return res.status(200).json({
          success: false,
          type: "validation_error",
          title: "File Required",
          message: "No file uploaded",
          notificationType: "warning",
        });
      }

      tempPath = req.file.path;
      const fileSizeBytes = req.file.size || 0;

      if (!req.body.userEmail) {
        return res.status(200).json({
          success: false,
          type: "validation_error",
          title: "Email Required",
          message: "User email is required",
          notificationType: "warning",
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(req.body.userEmail)) {
        return res.status(200).json({
          success: false,
          type: "validation_error",
          title: "Invalid Email",
          message: "Invalid email address",
          notificationType: "warning",
        });
      }

      // ✅ PLAN + TOPUP LIMIT CHECK WITH FILE SIZE
      if (userId) {
        try {
          // console.log(
          //   "🔍 [SECURITY DEBUG] Checking limits for user (share):",
          //   userId
          // );

          const limitCheck = await checkLimits(
            userId,
            "security-tools",
            fileSizeBytes
          );
          creditsInfo = limitCheck.creditsInfo;

          // console.log("🔍 [SECURITY DEBUG] Security Limit Check:", {
          //   allowed: limitCheck.allowed,
          //   reason: limitCheck.reason,
          //   currentUsage: limitCheck.usage?.securityTools,
          //   limit: limitCheck.plan?.securityToolsLimit,
          // });

          if (!limitCheck.allowed) {
            return res.status(200).json({
              success: false,
              type: "limit_exceeded",
              title: limitCheck.title || "Usage Limit Reached",
              message: limitCheck.reason,
              notificationType: "error",
              currentUsage: limitCheck.usage?.securityTools || 0,
              limit: limitCheck.plan?.securityToolsLimit || 0,
              upgradeRequired: limitCheck.upgradeRequired || true,
            });
          }
        } catch (limitErr) {
          console.error("❌ [SECURITY DEBUG] Limit check error:", limitErr);
          return res.status(200).json({
            success: false,
            type: "limit_exceeded",
            title: "Usage Limit Error",
            message: limitErr.message,
            notificationType: "error",
          });
        }
      }

      const fileBuffer = await fs.readFile(tempPath);

      let permissions = { read: true, write: false, delete: false };
      if (req.body.permissions) {
        try {
          permissions =
            typeof req.body.permissions === "string"
              ? JSON.parse(req.body.permissions)
              : req.body.permissions;
        } catch (e) {
          console.warn("Invalid permissions format, using defaults");
        }
      }

      const fileId = crypto.randomBytes(16).toString("hex");
      const fileInfo = {
        originalName: req.file.originalname,
        fileData: fileBuffer,
        owner: req.body.userEmail,
        sharedWith: [req.body.userEmail],
        permissions: permissions,
        createdAt: new Date().toISOString(),
      };

      encryptedFiles.set(fileId, fileInfo);

      if (!fileAccessMap.has(fileId)) {
        fileAccessMap.set(fileId, []);
      }

      fileAccessMap.get(fileId).push({
        email: req.body.userEmail,
        permissions: permissions,
        grantedAt: new Date().toISOString(),
      });

      // Save to Security model if user is authenticated
      let securityRecord = null;
      let incrementResult = null;

      if (userId) {
        try {
          securityRecord = await saveToSecurityModel(
            fileBuffer,
            req.file.originalname,
            `shared-${req.file.originalname}`,
            "file-sharing",
            userId,
            {
              fileId: fileId,
              sharedWith: [req.body.userEmail],
              permissions: permissions,
              accessCount: 1,
              processedAt: new Date().toISOString(),
            }
          );

          incrementResult = await incrementUsage(userId, "security-tools");
          // console.log("✅ [SECURITY DEBUG] Usage incremented for file sharing:", {
          //   userId: userId,
          //   creditsUsed: incrementResult?.creditsUsed,
          //   topupRemaining: incrementResult?.creditsUsed?.topupRemaining,
          // });
        } catch (saveError) {
          console.error("Failed to save to Security model:", saveError);
        }
      }

      const responseData = {
        success: true,
        type: "file_sharing_success",
        title: "File Shared Successfully",
        message: `File shared with ${req.body.userEmail} successfully`,
        notificationType: "success",
        fileId: fileId,
        accessList: fileAccessMap.get(fileId),
        securityId: securityRecord?._id,
        downloadUrl: securityRecord?.downloadUrl || null,
      };

      res.json(responseData);
    } catch (error) {
      console.error("❌ File sharing error:", error);
      res.status(200).json({
        success: false,
        type: "file_sharing_error",
        title: "Sharing Failed",
        message: "Failed to share file: " + error.message,
        notificationType: "error",
      });
    } finally {
      if (tempPath) {
        fs.unlink(tempPath).catch(() => {});
      }
    }
  },

  // Add user to file access - (no upload here, so no file-size check)
  addUserToFileAccess: async (req, res) => {
    try {
     // console.log("🔍 [SECURITY DEBUG] Add user access request received");
      const userId = req.user?.id;
      let creditsInfo = null;

      const { fileId, userEmail, permissions } = req.body;

      if (!fileId || !userEmail) {
        return res.status(200).json({
          success: false,
          type: "validation_error",
          title: "Missing Information",
          message: "File ID and user email are required",
          notificationType: "warning",
        });
      }

      const fileInfo = encryptedFiles.get(fileId);
      if (!fileInfo) {
        return res.status(200).json({
          success: false,
          type: "not_found",
          title: "File Not Found",
          message: "File not found",
          notificationType: "error",
        });
      }

      // ✅ Limit check without file size (count-based only)
      if (userId) {
        try {
          // console.log(
          //   "🔍 [SECURITY DEBUG] Checking limits for user (access grant):",
          //   userId
          // );

          const limitCheck = await checkLimits(
            userId,
            "security-tools",
            0 // no file upload here
          );
          creditsInfo = limitCheck.creditsInfo;

          if (!limitCheck.allowed) {
            return res.status(200).json({
              success: false,
              type: "limit_exceeded",
              title: limitCheck.title || "Usage Limit Reached",
              message: limitCheck.reason,
              notificationType: "error",
              currentUsage: limitCheck.usage?.securityTools || 0,
              limit: limitCheck.plan?.securityToolsLimit || 0,
              upgradeRequired: limitCheck.upgradeRequired || true,
            });
          }
        } catch (limitErr) {
          console.error("❌ [SECURITY DEBUG] Limit check error:", limitErr);
          return res.status(200).json({
            success: false,
            type: "limit_exceeded",
            title: "Usage Limit Error",
            message: limitErr.message,
            notificationType: "error",
          });
        }
      }

      let parsedPermissions = { read: true, write: false, delete: false };
      if (permissions) {
        try {
          parsedPermissions =
            typeof permissions === "string"
              ? JSON.parse(permissions)
              : permissions;
        } catch (e) {
          console.warn("Invalid permissions format, using defaults");
        }
      }

      if (!fileAccessMap.has(fileId)) {
        fileAccessMap.set(fileId, []);
      }

      const existingAccess = fileAccessMap
        .get(fileId)
        .find((access) => access.email === userEmail);
      if (existingAccess) {
        existingAccess.permissions = parsedPermissions;
        existingAccess.updatedAt = new Date().toISOString();
      } else {
        fileAccessMap.get(fileId).push({
          email: userEmail,
          permissions: parsedPermissions,
          grantedAt: new Date().toISOString(),
        });
      }

      // Save to Security model if user is authenticated
      let securityRecord = null;
      let incrementResult = null;

      if (userId) {
        try {
          securityRecord = await saveToSecurityModel(
            Buffer.from(""),
            fileInfo.originalName,
            `access-granted-${fileInfo.originalName}`,
            "access-grant",
            userId,
            {
              fileId: fileId,
              userEmail: userEmail,
              permissions: parsedPermissions,
              accessListCount: fileAccessMap.get(fileId).length,
              processedAt: new Date().toISOString(),
            }
          );

          incrementResult = await incrementUsage(userId, "security-tools");
          // console.log(
          //   "✅ [SECURITY DEBUG] Usage incremented for access grant:",
          //   {
          //     userId: userId,
          //     creditsUsed: incrementResult?.creditsUsed,
          //     topupRemaining: incrementResult?.creditsUsed?.topupRemaining,
          //   }
          // );
        } catch (saveError) {
          console.error("Failed to save to Security model:", saveError);
        }
      }

      const responseData = {
        success: true,
        type: "access_grant_success",
        title: "Access Granted",
        message: `Access granted to ${userEmail} successfully`,
        notificationType: "success",
        accessList: fileAccessMap.get(fileId),
        securityId: securityRecord?._id,
      };

      res.json(responseData);
    } catch (error) {
      console.error("❌ Add user access error:", error);
      res.status(200).json({
        success: false,
        type: "access_grant_error",
        title: "Access Grant Failed",
        message: "Failed to grant access: " + error.message,
        notificationType: "error",
      });
    }
  },

  // Access shared file - (no new upload; still counted for credits)
  accessSharedFile: async (req, res) => {
    try {
     // console.log("🔍 [SECURITY DEBUG] Access shared file request received");
      const userId = req.user?.id;
      let creditsInfo = null;

      const { fileId, userEmail } = req.body;

      if (!fileId || !userEmail) {
        return res.status(200).json({
          success: false,
          type: "validation_error",
          title: "Missing Information",
          message: "File ID and user email are required",
          notificationType: "warning",
        });
      }

      const fileInfo = encryptedFiles.get(fileId);
      if (!fileInfo) {
        return res.status(200).json({
          success: false,
          type: "not_found",
          title: "File Not Found",
          message: "File not found",
          notificationType: "error",
        });
      }

      const userAccess = fileAccessMap
        .get(fileId)
        ?.find((access) => access.email === userEmail);
      if (!userAccess || !userAccess.permissions.read) {
        return res.status(200).json({
          success: false,
          type: "access_denied",
          title: "Access Denied",
          message: "Access denied. You do not have permission to view this file.",
          notificationType: "error",
        });
      }

      // ✅ Counted usage, but no file-size limit here (no upload)
      if (userId) {
        try {
          // console.log(
          //   "🔍 [SECURITY DEBUG] Checking limits for user (file access):",
          //   userId
          // );

          const limitCheck = await checkLimits(
            userId,
            "security-tools",
            0 // no upload
          );
          creditsInfo = limitCheck.creditsInfo;

          if (!limitCheck.allowed) {
            return res.status(200).json({
              success: false,
              type: "limit_exceeded",
              title: limitCheck.title || "Usage Limit Reached",
              message: limitCheck.reason,
              notificationType: "error",
              currentUsage: limitCheck.usage?.securityTools || 0,
              limit: limitCheck.plan?.securityToolsLimit || 0,
              upgradeRequired: limitCheck.upgradeRequired || true,
            });
          }
        } catch (limitErr) {
          console.error("❌ [SECURITY DEBUG] Limit check error:", limitErr);
          return res.status(200).json({
            success: false,
            type: "limit_exceeded",
            title: "Usage Limit Error",
            message: limitErr.message,
            notificationType: "error",
          });
        }
      }

      const fileExtension = fileInfo.originalName
        .split(".")
        .pop()
        .toLowerCase();
      const mimeTypes = {
        pdf: "application/pdf",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        gif: "image/gif",
        txt: "text/plain",
      };

      const contentType = mimeTypes[fileExtension] || "application/octet-stream";

      // Save to Security model if user is authenticated
      let securityRecord = null;
      let incrementResult = null;

      if (userId) {
        try {
          securityRecord = await saveToSecurityModel(
            fileInfo.fileData,
            fileInfo.originalName,
            `accessed-${fileInfo.originalName}`,
            "file-sharing",
            userId,
            {
              fileId: fileId,
              accessedBy: userEmail,
              permissions: userAccess.permissions,
              processedAt: new Date().toISOString(),
            }
          );

          incrementResult = await incrementUsage(userId, "security-tools");
          // console.log("✅ [SECURITY DEBUG] Usage incremented for file access:", {
          //   userId: userId,
          //   creditsUsed: incrementResult?.creditsUsed,
          //   topupRemaining: incrementResult?.creditsUsed?.topupRemaining,
          // });
        } catch (saveError) {
          console.error("Failed to save to Security model:", saveError);
        }
      }

      res.setHeader("Content-Type", contentType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileInfo.originalName}"`
      );
      res.setHeader("X-File-Extension", fileExtension);
      res.setHeader("X-Original-Filename", fileInfo.originalName);

      if (securityRecord) {
        res.setHeader("X-Security-Id", securityRecord._id.toString());
        res.setHeader("X-Download-Url", securityRecord.downloadUrl);
        res.setHeader("X-File-Saved", "true");
      }

      res.send(fileInfo.fileData);
    } catch (error) {
      console.error("❌ Access shared file error:", error);
      res.status(200).json({
        success: false,
        type: "file_access_error",
        title: "Access Failed",
        message: "Failed to access file: " + error.message,
        notificationType: "error",
      });
    }
  },

  // List 2FA protected files
  list2FAProtectedFiles: async (req, res) => {
    try {
      const files = Array.from(twoFactorProtectedFiles.entries()).map(
        ([fileId, fileData]) => ({
          fileId: fileId,
          originalName: fileData.originalName,
          identifier: fileData.identifier,
          createdAt: fileData.createdAt,
          fileSize: fileData.fileData.length,
        })
      );

      res.json({
        success: true,
        files: files,
        total: files.length,
      });
    } catch (error) {
      console.error("List 2FA files error:", error);
      res.status(200).json({
        success: false,
        type: "server_error",
        title: "List Failed",
        message: "Failed to list protected files",
        notificationType: "error",
      });
    }
  },

  // Remove 2FA protected file
  remove2FAProtectedFile: async (req, res) => {
    try {
      const { fileId } = req.body;
      if (!fileId) {
        return res.status(200).json({
          success: false,
          type: "validation_error",
          title: "File ID Required",
          message: "File ID is required",
          notificationType: "warning",
        });
      }

      const deleted = twoFactorProtectedFiles.delete(fileId);
      if (!deleted) {
        return res.status(200).json({
          success: false,
          type: "not_found",
          title: "File Not Found",
          message: "Protected file not found",
          notificationType: "error",
        });
      }

      res.json({
        success: true,
        type: "file_removed",
        title: "File Removed",
        message: "Protected file removed successfully",
        notificationType: "success",
      });
    } catch (error) {
      console.error("Remove 2FA file error:", error);
      res.status(200).json({
        success: false,
        type: "server_error",
        title: "Remove Failed",
        message: "Failed to remove protected file",
        notificationType: "error",
      });
    }
  },

  // Get file access list
  getFileAccessList: async (req, res) => {
    try {
      const { fileId } = req.query;
      if (!fileId) {
        return res.status(200).json({
          success: false,
          type: "validation_error",
          title: "File ID Required",
          message: "File ID is required",
          notificationType: "warning",
        });
      }

      const accessList = fileAccessMap.get(fileId) || [];
      res.json({
        success: true,
        accessList: accessList,
      });
    } catch (error) {
      console.error("Get file access list error:", error);
      res.status(200).json({
        success: false,
        type: "server_error",
        title: "List Failed",
        message: "Failed to get access list",
        notificationType: "error",
      });
    }
  },

  // List shared files
  listSharedFiles: async (req, res) => {
    try {
      const files = Array.from(encryptedFiles.entries()).map(
        ([fileId, fileData]) => ({
          fileId: fileId,
          originalName: fileData.originalName,
          owner: fileData.owner,
          createdAt: fileData.createdAt,
          fileSize: fileData.fileData.length,
          accessCount: fileAccessMap.get(fileId)?.length || 0,
        })
      );

      res.json({
        success: true,
        files: files,
        total: files.length,
      });
    } catch (error) {
      console.error("List shared files error:", error);
      res.status(200).json({
        success: false,
        type: "server_error",
        title: "List Failed",
        message: "Failed to list shared files",
        notificationType: "error",
      });
    }
  },

  // ✅ NEW: Get user's security credits endpoint
  getUserSecurityCredits,

  // Export the download and history functions
  downloadSecurityFile,
  getSecurityHistory,
};

module.exports = SecurityController;
