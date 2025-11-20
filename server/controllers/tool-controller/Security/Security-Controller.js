// server/controllers/tool-controller/Security/Security-Controller.js

const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// In-memory storage
let accessList = [];
let encryptedFiles = new Map();
let twoFactorProtectedFiles = new Map();
let fileAccessMap = new Map();

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
  // File Encryption
  encryptFile: [
    upload.single('files'),
    async (req, res) => {
      try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        const useRandomPassword = req.body.useRandomPassword === 'true';
        let password = req.headers['password'];

        if (useRandomPassword && !password) password = generateRandomPassword();
        if (!password) return res.status(400).json({ error: 'Password is required' });

        const encryptedBuffer = encryptBuffer(req.file.buffer, password);
        const fileId = crypto.randomBytes(16).toString('hex');
        
        encryptedFiles.set(fileId, {
          originalName: req.file.originalname,
          encryptedData: encryptedBuffer,
          password: password,
          createdAt: new Date().toISOString()
        });

        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="encrypted_${req.file.originalname}.enc"`);
        res.setHeader('X-File-ID', fileId);
        if (useRandomPassword) res.setHeader('X-Generated-Password', password);
        
        res.send(encryptedBuffer);

      } catch (error) {
        console.error('Encryption error:', error);
        res.status(500).json({ error: 'Encryption failed: ' + error.message });
      }
    }
  ],

  // File Decryption
  decryptFile: [
    upload.single('files'),
    async (req, res) => {
      try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        
        const password = req.headers['password'];
        if (!password) return res.status(400).json({ error: 'Password is required for decryption' });

        const decryptedBuffer = decryptBuffer(req.file.buffer, password);
        let originalName = 'decrypted_file';
        if (req.file.originalname.endsWith('.enc')) originalName = req.file.originalname.slice(0, -4);

        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${originalName}"`);
        res.send(decryptedBuffer);

      } catch (error) {
        console.error('Decryption error:', error);
        res.status(400).json({ error: error.message });
      }
    }
  ],

  // Protect PDF with 2FA
  protectPDFWith2FA: [
    upload.single('files'),
    async (req, res) => {
      try {
        if (!req.file) return res.status(400).json({ error: 'No PDF file uploaded' });
        if (!req.file.mimetype.includes('pdf')) return res.status(400).json({ error: 'Only PDF files are supported' });
        if (!req.body.identifier) return res.status(400).json({ error: 'Identifier is required' });

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

        res.json({
          success: true,
          fileId: fileId,
          secret: secret.base32,
          qrCode: qrCodeUrl,
          message: 'PDF protected with 2FA successfully.'
        });

      } catch (error) {
        console.error('2FApdfworkstection error:', error);
        res.status(500).json({ error: 'Failed to protect PDF with 2FA' });
      }
    }
  ],

  // Access 2FA Protected PDF
  access2FAProtectedPDF: [
    upload.none(),
    async (req, res) => {
      try {
        const { fileId, token } = req.body;
        if (!fileId || !token) return res.status(400).json({ error: 'File ID and 2FA token are required' });

        const fileData = twoFactorProtectedFiles.get(fileId);
        if (!fileData) return res.status(404).json({ error: 'Protected file not found' });

        const verified = speakeasy.totp.verify({
          secret: fileData.secret,
          encoding: 'base32',
          token: token,
          window: 1
        });

        if (!verified) return res.status(401).json({ error: 'Invalid 2FA token' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileData.originalName}"`);
        res.send(fileData.fileData);

      } catch (error) {
        console.error('2FA PDF access error:', error);
        res.status(500).json({ error: 'Failed to access protected PDF' });
      }
    }
  ],

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

      res.json({ success: true, files: files, total: files.length });
    } catch (error) {
      console.error('List 2FA files error:', error);
      res.status(500).json({ error: 'Failed to list protected files' });
    }
  },

  // Remove 2FA protected file
  remove2FAProtectedFile: [
    upload.none(),
    async (req, res) => {
      try {
        const { fileId } = req.body;
        if (!fileId) return res.status(400).json({ error: 'File ID is required' });

        const deleted = twoFactorProtectedFiles.delete(fileId);
        if (!deleted) return res.status(404).json({ error: 'Protected file not found' });

        res.json({ success: true, message: 'Protected file removed successfully' });
      } catch (error) {
        console.error('Remove 2FA file error:', error);
        res.status(500).json({ error: 'Failed to remove protected file' });
      }
    }
  ],

  // Share file with access control
  shareFileWithAccess: [
    upload.single('files'),
    async (req, res) => {
      try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        if (!req.body.userEmail) return res.status(400).json({ error: 'User email is required' });

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(req.body.userEmail)) return res.status(400).json({ error: 'Invalid email address' });

        let permissions = { read: true, write: false, delete: false };
        if (req.body.permissions) {
          try {
            permissions = typeof req.body.permissions === 'string' ? JSON.parse(req.body.permissions) : req.body.permissions;
          } catch (e) {
            permissions = { read: true, write: false, delete: false };
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
        
        if (!fileAccessMap.has(fileId)) fileAccessMap.set(fileId, []);
        fileAccessMap.get(fileId).push({
          email: req.body.userEmail,
          permissions: permissions,
          grantedAt: new Date().toISOString()
        });

        res.json({
          success: true,
          fileId: fileId,
          message: `File shared with ${req.body.userEmail} successfully`,
          accessList: fileAccessMap.get(fileId)
        });

      } catch (error) {
        console.error('File sharing error:', error);
        res.status(500).json({ error: 'Failed to share file' });
      }
    }
  ],

  // Add user to file access
  addUserToFileAccess: [
    upload.none(),
    async (req, res) => {
      try {
        const { fileId, userEmail, permissions } = req.body;
        if (!fileId || !userEmail) return res.status(400).json({ error: 'File ID and user email are required' });

        const fileInfo = encryptedFiles.get(fileId);
        if (!fileInfo) return res.status(404).json({ error: 'File not found' });

        let parsedPermissions = { read: true, write: false, delete: false };
        if (permissions) {
          try {
            parsedPermissions = typeof permissions === 'string' ? JSON.parse(permissions) : permissions;
          } catch (e) {
            parsedPermissions = { read: true, write: false, delete: false };
          }
        }

        if (!fileAccessMap.has(fileId)) fileAccessMap.set(fileId, []);

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

        res.json({
          success: true,
          message: `Access granted to ${userEmail} successfully`,
          accessList: fileAccessMap.get(fileId)
        });

      } catch (error) {
        console.error('Add user access error:', error);
        res.status(500).json({ error: 'Failed to grant access' });
      }
    }
  ],

  // Access shared file - FIXED VERSION
  accessSharedFile: [
    upload.none(),
    async (req, res) => {
      try {
        const { fileId, userEmail } = req.body;
        if (!fileId || !userEmail) return res.status(400).json({ error: 'File ID and user email are required' });

        const fileInfo = encryptedFiles.get(fileId);
        if (!fileInfo) return res.status(404).json({ error: 'File not found' });

        const userAccess = fileAccessMap.get(fileId)?.find(access => access.email === userEmail);
        if (!userAccess || !userAccess.permissions.read) {
          return res.status(403).json({ error: 'Access denied. You do not have permission to view this file.' });
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

        // Set proper headers
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.originalName}"`);
        res.setHeader('X-File-Extension', fileExtension);
        res.setHeader('X-Original-Filename', fileInfo.originalName);
        
        res.send(fileInfo.fileData);

      } catch (error) {
        console.error('Access shared file error:', error);
        res.status(500).json({ error: 'Failed to access file' });
      }
    }
  ],

  // Get file access list
  getFileAccessList: async (req, res) => {
    try {
      const { fileId } = req.query;
      if (!fileId) return res.status(400).json({ error: 'File ID is required' });

      const accessList = fileAccessMap.get(fileId) || [];
      res.json({ success: true, accessList: accessList });
    } catch (error) {
      console.error('Get file access list error:', error);
      res.status(500).json({ error: 'Failed to get access list' });
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

      res.json({ success: true, files: files, total: files.length });
    } catch (error) {
      console.error('List shared files error:', error);
      res.status(500).json({ error: 'Failed to list shared files' });
    }
  }
};

module.exports = SecurityController;