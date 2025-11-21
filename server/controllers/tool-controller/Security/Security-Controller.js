// server/controllers/tool-controller/Security/Security-Controller.js
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const fs = require('fs').promises;
const path = require('path');
const Security = require("../../../models/tools-models/Security/Security-Model");

// ✅ FIXED: Import usage tracking functions
const { checkLimits } = require("../../../utils/checkLimits");
const { incrementUsage } = require("../../../utils/incrementUsage");

// In-memory storage
let encryptedFiles = new Map();
let twoFactorProtectedFiles = new Map();
let fileAccessMap = new Map();

// Save security operation to Security model
const saveToSecurityModel = async (fileBuffer, originalFilename, processedFilename, operationType, userId, metadata = {}) => {
  try {
    const uploadsDir = path.join(__dirname, '../../../uploads/security');
    await fs.mkdir(uploadsDir, { recursive: true });

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
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
      securityMetadata: metadata
    });

    await securityRecord.save();
    console.log("✅ Security operation saved to Security model:", securityRecord._id);
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
    const filePath = path.join(__dirname, '../../../uploads/security', filename);

    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    const fileBuffer = await fs.readFile(filePath);
    const fileExtension = path.extname(filename).toLowerCase().replace('.', '');

    const mimeTypes = {
      'pdf': 'application/pdf',
      'enc': 'application/octet-stream',
      'jpg': 'image/jpeg', 'jpeg': 'image/jpeg',
      'png': 'image/png', 'gif': 'image/gif',
      'txt': 'text/plain'
    };

    const contentType = mimeTypes[fileExtension] || 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(fileBuffer);

  } catch (error) {
    console.error('Download security file error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get user's security history
const getSecurityHistory = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const securityOps = await Security.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      securityOps
    });

  } catch (error) {
    console.error('Get security history error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const generateRandomPassword = (length = 16) => {
  return crypto.randomBytes(length).toString('hex');
};

const encryptBuffer = (buffer, password) => {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(password, 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  return Buffer.concat([iv, cipher.update(buffer), cipher.final()]);
};

const decryptBuffer = (buffer, password) => {
  try {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(password, 'salt', 32);
    const iv = buffer.slice(0, 16);
    const encryptedData = buffer.slice(16);
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    return Buffer.concat([decipher.update(encryptedData), decipher.final()]);
  } catch (error) {
    throw new Error('Decryption failed - invalid password or corrupted file');
  }
};

const SecurityController = {
  // File Encryption - WITH USAGE LIMITS
  encryptFile: async (req, res) => {
    try {
      console.log('Encrypt file request received:', {
        file: req.file ? {
          originalname: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype
        } : 'No file',
        headers: req.headers,
        body: req.body,
        user: req.user
      });

      const userId = req.user?.id;

      // -------------------------------------------------------
      // ✅ USAGE LIMIT CHECK - FIXED
      // -------------------------------------------------------
      if (userId) {
        try {
          const limitCheck = await checkLimits(userId, "security-tools");
          if (!limitCheck.allowed) {
            return res.status(200).json({
              success: false,
              type: "limit_exceeded",
              title: "Usage Limit Reached",
              message: limitCheck.reason,
              notificationType: "error",
              currentUsage: limitCheck.usage?.securityTools || 0,
              limit: limitCheck.plan?.securityToolsLimit || 0,
              upgradeRequired: true
            });
          }
        } catch (limitErr) {
          return res.status(200).json({
            success: false,
            type: "limit_exceeded",
            title: "Usage Limit Error",
            message: limitErr.message,
            notificationType: "error"
          });
        }
      }

      if (!req.file) {
        return res.status(400).json({ 
          success: false,
          error: 'No file uploaded. Please select a file.' 
        });
      }

      const useRandomPassword = req.body.useRandomPassword === 'true';
      let password = req.headers['password'];

      if (useRandomPassword && !password) {
        password = generateRandomPassword();
      }
      
      if (!password) {
        return res.status(400).json({ 
          success: false,
          error: 'Password is required for encryption' 
        });
      }

      const encryptedBuffer = encryptBuffer(req.file.buffer, password);
      const fileId = crypto.randomBytes(16).toString('hex');
      
      encryptedFiles.set(fileId, {
        originalName: req.file.originalname,
        encryptedData: encryptedBuffer,
        password: password,
        createdAt: new Date().toISOString()
      });

      // Save to Security model if user is authenticated
      let securityRecord = null;
      if (userId) {
        try {
          securityRecord = await saveToSecurityModel(
            encryptedBuffer,
            req.file.originalname,
            `encrypted-${req.file.originalname}.enc`,
            'encryption',
            userId,
            {
              fileId: fileId,
              useRandomPassword: useRandomPassword,
              algorithm: 'AES-256-CBC',
              processedAt: new Date().toISOString()
            }
          );

          // ✅ INCREMENT USAGE FOR SECURITY TOOLS
          await incrementUsage(userId, "security-tools");

        } catch (saveError) {
          console.error("Failed to save to Security model:", saveError);
        }
      }

      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="encrypted_${req.file.originalname}.enc"`);
      res.setHeader('X-File-ID', fileId);
      
      if (useRandomPassword) {
        res.setHeader('X-Generated-Password', password);
      }
      
      if (securityRecord) {
        res.setHeader('X-Security-Id', securityRecord._id.toString());
        res.setHeader('X-Download-Url', securityRecord.downloadUrl);
        res.setHeader('X-File-Saved', "true");
      }
      
      res.send(encryptedBuffer);

    } catch (error) {
      console.error('Encryption error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Encryption failed: ' + error.message 
      });
    }
  },

  // File Decryption - WITH USAGE LIMITS
  decryptFile: async (req, res) => {
    try {
      console.log('Decrypt file request received:', {
        file: req.file ? {
          originalname: req.file.originalname,
          size: req.file.size
        } : 'No file',
        user: req.user
      });

      const userId = req.user?.id;

      // -------------------------------------------------------
      // ✅ USAGE LIMIT CHECK - FIXED
      // -------------------------------------------------------
      if (userId) {
        try {
          const limitCheck = await checkLimits(userId, "security-tools");
          if (!limitCheck.allowed) {
            return res.status(200).json({
              success: false,
              type: "limit_exceeded",
              title: "Usage Limit Reached",
              message: limitCheck.reason,
              notificationType: "error",
              currentUsage: limitCheck.usage?.securityTools || 0,
              limit: limitCheck.plan?.securityToolsLimit || 0,
              upgradeRequired: true
            });
          }
        } catch (limitErr) {
          return res.status(200).json({
            success: false,
            type: "limit_exceeded",
            title: "Usage Limit Error",
            message: limitErr.message,
            notificationType: "error"
          });
        }
      }

      if (!req.file) {
        return res.status(400).json({ 
          success: false,
          error: 'No file uploaded' 
        });
      }
      
      const password = req.headers['password'];
      
      if (!password) {
        return res.status(400).json({ 
          success: false,
          error: 'Password is required for decryption' 
        });
      }

      const decryptedBuffer = decryptBuffer(req.file.buffer, password);
      let originalName = 'decrypted_file';
      
      if (req.file.originalname.endsWith('.enc')) {
        originalName = req.file.originalname.slice(0, -4);
      }

      // Save to Security model if user is authenticated
      let securityRecord = null;
      if (userId) {
        try {
          securityRecord = await saveToSecurityModel(
            decryptedBuffer,
            req.file.originalname,
            `decrypted-${originalName}`,
            'decryption',
            userId,
            {
              algorithm: 'AES-256-CBC',
              processedAt: new Date().toISOString()
            }
          );

          // ✅ INCREMENT USAGE FOR SECURITY TOOLS
          await incrementUsage(userId, "security-tools");

        } catch (saveError) {
          console.error("Failed to save to Security model:", saveError);
        }
      }

      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${originalName}"`);
      
      if (securityRecord) {
        res.setHeader('X-Security-Id', securityRecord._id.toString());
        res.setHeader('X-Download-Url', securityRecord.downloadUrl);
        res.setHeader('X-File-Saved', "true");
      }
      
      res.send(decryptedBuffer);

    } catch (error) {
      console.error('Decryption error:', error);
      res.status(400).json({ 
        success: false,
        error: error.message 
      });
    }
  },

  // Protect PDF with 2FA - WITH USAGE LIMITS
  protectPDFWith2FA: async (req, res) => {
    try {
      console.log('Protect PDF with 2FA request received:', {
        file: req.file ? {
          originalname: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype
        } : 'No file',
        body: req.body,
        user: req.user
      });

      const userId = req.user?.id;

      // -------------------------------------------------------
      // ✅ USAGE LIMIT CHECK - FIXED
      // -------------------------------------------------------
      if (userId) {
        try {
          const limitCheck = await checkLimits(userId, "security-tools");
          if (!limitCheck.allowed) {
            return res.status(200).json({
              success: false,
              type: "limit_exceeded",
              title: "Usage Limit Reached",
              message: limitCheck.reason,
              notificationType: "error",
              currentUsage: limitCheck.usage?.securityTools || 0,
              limit: limitCheck.plan?.securityToolsLimit || 0,
              upgradeRequired: true
            });
          }
        } catch (limitErr) {
          return res.status(200).json({
            success: false,
            type: "limit_exceeded",
            title: "Usage Limit Error",
            message: limitErr.message,
            notificationType: "error"
          });
        }
      }

      if (!req.file) {
        return res.status(400).json({ 
          success: false,
          error: 'No PDF file uploaded' 
        });
      }
      
      if (!req.file.mimetype.includes('pdf')) {
        return res.status(400).json({ 
          success: false,
          error: 'Only PDF files are supported for 2FA protection' 
        });
      }
      
      if (!req.body.identifier) {
        return res.status(400).json({ 
          success: false,
          error: 'Identifier is required' 
        });
      }

      const secret = speakeasy.generateSecret({
        name: `ProtectedPDF (${req.body.identifier})`,
        issuer: "SecurePDF",
        length: 20
      });

      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
      const fileId = crypto.randomBytes(16).toString('hex');
      
      twoFactorProtectedFiles.set(fileId, {
        originalName: req.file.originalname,
        fileData: req.file.buffer,
        secret: secret.base32,
        identifier: req.body.identifier,
        createdAt: new Date().toISOString()
      });

      // Save to Security model if user is authenticated
      let securityRecord = null;
      if (userId) {
        try {
          securityRecord = await saveToSecurityModel(
            req.file.buffer,
            req.file.originalname,
            `2fa-protected-${req.file.originalname}`,
            '2fa-protection',
            userId,
            {
              fileId: fileId,
              identifier: req.body.identifier,
              secretKey: secret.base32,
              qrCodeGenerated: true,
              processedAt: new Date().toISOString()
            }
          );

          // ✅ INCREMENT USAGE FOR SECURITY TOOLS
          await incrementUsage(userId, "security-tools");

        } catch (saveError) {
          console.error("Failed to save to Security model:", saveError);
        }
      }

      res.json({
        success: true,
        fileId: fileId,
        secret: secret.base32,
        qrCode: qrCodeUrl,
        message: 'PDF protected with 2FA successfully.',
        securityId: securityRecord?._id
      });

    } catch (error) {
      console.error('2FA Protection error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to protect PDF with 2FA: ' + error.message 
      });
    }
  },

  // Access 2FA Protected PDF - WITH USAGE LIMITS
  access2FAProtectedPDF: async (req, res) => {
    try {
      console.log('Access 2FA PDF request received:', {
        body: req.body,
        user: req.user
      });

      const userId = req.user?.id;

      // -------------------------------------------------------
      // ✅ USAGE LIMIT CHECK - FIXED
      // -------------------------------------------------------
      if (userId) {
        try {
          const limitCheck = await checkLimits(userId, "security-tools");
          if (!limitCheck.allowed) {
            return res.status(200).json({
              success: false,
              type: "limit_exceeded",
              title: "Usage Limit Reached",
              message: limitCheck.reason,
              notificationType: "error",
              currentUsage: limitCheck.usage?.securityTools || 0,
              limit: limitCheck.plan?.securityToolsLimit || 0,
              upgradeRequired: true
            });
          }
        } catch (limitErr) {
          return res.status(200).json({
            success: false,
            type: "limit_exceeded",
            title: "Usage Limit Error",
            message: limitErr.message,
            notificationType: "error"
          });
        }
      }

      const { fileId, token } = req.body;
      
      if (!fileId || !token) {
        return res.status(400).json({ 
          success: false,
          error: 'File ID and 2FA token are required' 
        });
      }

      const fileData = twoFactorProtectedFiles.get(fileId);
      if (!fileData) {
        return res.status(404).json({ 
          success: false,
          error: 'Protected file not found' 
        });
      }

      const verified = speakeasy.totp.verify({
        secret: fileData.secret,
        encoding: 'base32',
        token: token,
        window: 1
      });

      if (!verified) {
        return res.status(401).json({ 
          success: false,
          error: 'Invalid 2FA token' 
        });
      }

      // Save to Security model if user is authenticated
      let securityRecord = null;
      if (userId) {
        try {
          securityRecord = await saveToSecurityModel(
            fileData.fileData,
            fileData.originalName,
            `accessed-${fileData.originalName}`,
            '2fa-access',
            userId,
            {
              protectedFileId: fileId,
              identifier: fileData.identifier,
              tokenVerified: true,
              processedAt: new Date().toISOString()
            }
          );

          // ✅ INCREMENT USAGE FOR SECURITY TOOLS
          await incrementUsage(userId, "security-tools");

        } catch (saveError) {
          console.error("Failed to save to Security model:", saveError);
        }
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileData.originalName}"`);
      
      if (securityRecord) {
        res.setHeader('X-Security-Id', securityRecord._id.toString());
        res.setHeader('X-Download-Url', securityRecord.downloadUrl);
        res.setHeader('X-File-Saved', "true");
      }
      
      res.send(fileData.fileData);

    } catch (error) {
      console.error('2FA PDF access error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to access protected PDF: ' + error.message 
      });
    }
  },

  // Share file with access control - WITH USAGE LIMITS
  shareFileWithAccess: async (req, res) => {
    try {
      console.log('Share file request received:', {
        file: req.file ? {
          originalname: req.file.originalname,
          size: req.file.size
        } : 'No file',
        body: req.body,
        user: req.user
      });

      const userId = req.user?.id;

      // -------------------------------------------------------
      // ✅ USAGE LIMIT CHECK - FIXED
      // -------------------------------------------------------
      if (userId) {
        try {
          const limitCheck = await checkLimits(userId, "security-tools");
          if (!limitCheck.allowed) {
            return res.status(200).json({
              success: false,
              type: "limit_exceeded",
              title: "Usage Limit Reached",
              message: limitCheck.reason,
              notificationType: "error",
              currentUsage: limitCheck.usage?.securityTools || 0,
              limit: limitCheck.plan?.securityToolsLimit || 0,
              upgradeRequired: true
            });
          }
        } catch (limitErr) {
          return res.status(200).json({
            success: false,
            type: "limit_exceeded",
            title: "Usage Limit Error",
            message: limitErr.message,
            notificationType: "error"
          });
        }
      }

      if (!req.file) {
        return res.status(400).json({ 
          success: false,
          error: 'No file uploaded' 
        });
      }
      
      if (!req.body.userEmail) {
        return res.status(400).json({ 
          success: false,
          error: 'User email is required' 
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(req.body.userEmail)) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid email address' 
        });
      }

      let permissions = { read: true, write: false, delete: false };
      if (req.body.permissions) {
        try {
          permissions = typeof req.body.permissions === 'string' ? 
            JSON.parse(req.body.permissions) : req.body.permissions;
        } catch (e) {
          console.warn('Invalid permissions format, using defaults');
        }
      }

      const fileId = crypto.randomBytes(16).toString('hex');
      const fileInfo = {
        originalName: req.file.originalname,
        fileData: req.file.buffer,
        owner: req.body.userEmail,
        sharedWith: [req.body.userEmail],
        permissions: permissions,
        createdAt: new Date().toISOString()
      };

      encryptedFiles.set(fileId, fileInfo);
      
      if (!fileAccessMap.has(fileId)) {
        fileAccessMap.set(fileId, []);
      }
      
      fileAccessMap.get(fileId).push({
        email: req.body.userEmail,
        permissions: permissions,
        grantedAt: new Date().toISOString()
      });

      // Save to Security model if user is authenticated
      let securityRecord = null;
      if (userId) {
        try {
          securityRecord = await saveToSecurityModel(
            req.file.buffer,
            req.file.originalname,
            `shared-${req.file.originalname}`,
            'file-sharing',
            userId,
            {
              fileId: fileId,
              sharedWith: [req.body.userEmail],
              permissions: permissions,
              accessCount: 1,
              processedAt: new Date().toISOString()
            }
          );

          // ✅ INCREMENT USAGE FOR SECURITY TOOLS
          await incrementUsage(userId, "security-tools");

        } catch (saveError) {
          console.error("Failed to save to Security model:", saveError);
        }
      }

      res.json({
        success: true,
        fileId: fileId,
        message: `File shared with ${req.body.userEmail} successfully`,
        accessList: fileAccessMap.get(fileId),
        securityId: securityRecord?._id
      });

    } catch (error) {
      console.error('File sharing error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to share file: ' + error.message 
      });
    }
  },

  // Add user to file access - WITH USAGE LIMITS
  addUserToFileAccess: async (req, res) => {
    try {
      console.log('Add user access request received:', {
        body: req.body,
        user: req.user
      });

      const userId = req.user?.id;

      // -------------------------------------------------------
      // ✅ USAGE LIMIT CHECK - FIXED
      // -------------------------------------------------------
      if (userId) {
        try {
          const limitCheck = await checkLimits(userId, "security-tools");
          if (!limitCheck.allowed) {
            return res.status(200).json({
              success: false,
              type: "limit_exceeded",
              title: "Usage Limit Reached",
              message: limitCheck.reason,
              notificationType: "error",
              currentUsage: limitCheck.usage?.securityTools || 0,
              limit: limitCheck.plan?.securityToolsLimit || 0,
              upgradeRequired: true
            });
          }
        } catch (limitErr) {
          return res.status(200).json({
            success: false,
            type: "limit_exceeded",
            title: "Usage Limit Error",
            message: limitErr.message,
            notificationType: "error"
          });
        }
      }

      const { fileId, userEmail, permissions } = req.body;
      
      if (!fileId || !userEmail) {
        return res.status(400).json({ 
          success: false,
          error: 'File ID and user email are required' 
        });
      }

      const fileInfo = encryptedFiles.get(fileId);
      if (!fileInfo) {
        return res.status(404).json({ 
          success: false,
          error: 'File not found' 
        });
      }

      let parsedPermissions = { read: true, write: false, delete: false };
      if (permissions) {
        try {
          parsedPermissions = typeof permissions === 'string' ? 
            JSON.parse(permissions) : permissions;
        } catch (e) {
          console.warn('Invalid permissions format, using defaults');
        }
      }

      if (!fileAccessMap.has(fileId)) {
        fileAccessMap.set(fileId, []);
      }

      const existingAccess = fileAccessMap.get(fileId).find(access => access.email === userEmail);
      if (existingAccess) {
        existingAccess.permissions = parsedPermissions;
        existingAccess.updatedAt = new Date().toISOString();
      } else {
        fileAccessMap.get(fileId).push({
          email: userEmail,
          permissions: parsedPermissions,
          grantedAt: new Date().toISOString()
        });
      }

      // Save to Security model if user is authenticated
      let securityRecord = null;
      if (userId) {
        try {
          securityRecord = await saveToSecurityModel(
            Buffer.from(''), // Empty buffer for access grants
            fileInfo.originalName,
            `access-granted-${fileInfo.originalName}`,
            'access-grant',
            userId,
            {
              fileId: fileId,
              userEmail: userEmail,
              permissions: parsedPermissions,
              accessListCount: fileAccessMap.get(fileId).length,
              processedAt: new Date().toISOString()
            }
          );

          // ✅ INCREMENT USAGE FOR SECURITY TOOLS
          await incrementUsage(userId, "security-tools");

        } catch (saveError) {
          console.error("Failed to save to Security model:", saveError);
        }
      }

      res.json({
        success: true,
        message: `Access granted to ${userEmail} successfully`,
        accessList: fileAccessMap.get(fileId),
        securityId: securityRecord?._id
      });

    } catch (error) {
      console.error('Add user access error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to grant access: ' + error.message 
      });
    }
  },

  // Access shared file - WITH USAGE LIMITS
  accessSharedFile: async (req, res) => {
    try {
      console.log('Access shared file request received:', {
        body: req.body,
        user: req.user
      });

      const userId = req.user?.id;

      // -------------------------------------------------------
      // ✅ USAGE LIMIT CHECK - FIXED
      // -------------------------------------------------------
      if (userId) {
        try {
          const limitCheck = await checkLimits(userId, "security-tools");
          if (!limitCheck.allowed) {
            return res.status(200).json({
              success: false,
              type: "limit_exceeded",
              title: "Usage Limit Reached",
              message: limitCheck.reason,
              notificationType: "error",
              currentUsage: limitCheck.usage?.securityTools || 0,
              limit: limitCheck.plan?.securityToolsLimit || 0,
              upgradeRequired: true
            });
          }
        } catch (limitErr) {
          return res.status(200).json({
            success: false,
            type: "limit_exceeded",
            title: "Usage Limit Error",
            message: limitErr.message,
            notificationType: "error"
          });
        }
      }

      const { fileId, userEmail } = req.body;
      
      if (!fileId || !userEmail) {
        return res.status(400).json({ 
          success: false,
          error: 'File ID and user email are required' 
        });
      }

      const fileInfo = encryptedFiles.get(fileId);
      if (!fileInfo) {
        return res.status(404).json({ 
          success: false,
          error: 'File not found' 
        });
      }

      const userAccess = fileAccessMap.get(fileId)?.find(access => access.email === userEmail);
      if (!userAccess || !userAccess.permissions.read) {
        return res.status(403).json({ 
          success: false,
          error: 'Access denied. You do not have permission to view this file.' 
        });
      }

      // Determine content type
      const fileExtension = fileInfo.originalName.split('.').pop().toLowerCase();
      const mimeTypes = {
        'pdf': 'application/pdf',
        'jpg': 'image/jpeg', 'jpeg': 'image/jpeg',
        'png': 'image/png', 'gif': 'image/gif',
        'txt': 'text/plain'
      };

      const contentType = mimeTypes[fileExtension] || 'application/octet-stream';

      // Save to Security model if user is authenticated
      let securityRecord = null;
      if (userId) {
        try {
          securityRecord = await saveToSecurityModel(
            fileInfo.fileData,
            fileInfo.originalName,
            `accessed-${fileInfo.originalName}`,
            'file-sharing',
            userId,
            {
              fileId: fileId,
              accessedBy: userEmail,
              permissions: userAccess.permissions,
              processedAt: new Date().toISOString()
            }
          );

          // ✅ INCREMENT USAGE FOR SECURITY TOOLS
          await incrementUsage(userId, "security-tools");

        } catch (saveError) {
          console.error("Failed to save to Security model:", saveError);
        }
      }

      // Set proper headers
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.originalName}"`);
      res.setHeader('X-File-Extension', fileExtension);
      res.setHeader('X-Original-Filename', fileInfo.originalName);
      
      if (securityRecord) {
        res.setHeader('X-Security-Id', securityRecord._id.toString());
        res.setHeader('X-Download-Url', securityRecord.downloadUrl);
        res.setHeader('X-File-Saved', "true");
      }
      
      res.send(fileInfo.fileData);

    } catch (error) {
      console.error('Access shared file error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to access file: ' + error.message 
      });
    }
  },

  // List 2FA protected files
  list2FAProtectedFiles: async (req, res) => {
    try {
      const files = Array.from(twoFactorProtectedFiles.entries()).map(([fileId, fileData]) => ({
        fileId: fileId,
        originalName: fileData.originalName,
        identifier: fileData.identifier,
        createdAt: fileData.createdAt,
        fileSize: fileData.fileData.length
      }));

      res.json({ 
        success: true, 
        files: files, 
        total: files.length 
      });
    } catch (error) {
      console.error('List 2FA files error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to list protected files' 
      });
    }
  },

  // Remove 2FA protected file
  remove2FAProtectedFile: async (req, res) => {
    try {
      const { fileId } = req.body;
      if (!fileId) {
        return res.status(400).json({ 
          success: false,
          error: 'File ID is required' 
        });
      }

      const deleted = twoFactorProtectedFiles.delete(fileId);
      if (!deleted) {
        return res.status(404).json({ 
          success: false,
          error: 'Protected file not found' 
        });
      }

      res.json({ 
        success: true, 
        message: 'Protected file removed successfully' 
      });
    } catch (error) {
      console.error('Remove 2FA file error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to remove protected file' 
      });
    }
  },

  // Get file access list
  getFileAccessList: async (req, res) => {
    try {
      const { fileId } = req.query;
      if (!fileId) {
        return res.status(400).json({ 
          success: false,
          error: 'File ID is required' 
        });
      }

      const accessList = fileAccessMap.get(fileId) || [];
      res.json({ 
        success: true, 
        accessList: accessList 
      });
    } catch (error) {
      console.error('Get file access list error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to get access list' 
      });
    }
  },

  // List shared files
  listSharedFiles: async (req, res) => {
    try {
      const files = Array.from(encryptedFiles.entries()).map(([fileId, fileData]) => ({
        fileId: fileId,
        originalName: fileData.originalName,
        owner: fileData.owner,
        createdAt: fileData.createdAt,
        fileSize: fileData.fileData.length,
        accessCount: fileAccessMap.get(fileId)?.length || 0
      }));

      res.json({ 
        success: true, 
        files: files, 
        total: files.length 
      });
    } catch (error) {
      console.error('List shared files error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to list shared files' 
      });
    }
  },

  // Export the download and history functions
  downloadSecurityFile,
  getSecurityHistory
};

module.exports = SecurityController;