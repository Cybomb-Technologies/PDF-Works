// src/pages/tools/SecurityTools.jsx

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Lock,
  ShieldCheck,
  Users,
  Upload,
  Download,
  Eye,
  EyeOff,
  Copy,
  Check,
  FileText,
  Trash2,
  List,
} from "lucide-react";
import Metatags from "../../SEO/metatags";
const API_URL = import.meta.env.VITE_API_URL;

const tools = [
  {
    id: "encryption",
    name: "File Encryption",
    description: "Secure your files with AES encryption",
    icon: Lock,
    color: "from-red-500 to-rose-600",
  },
  {
    id: "auth",
    name: "2FA Protected PDF",
    description: "Protect PDFs with authenticator app",
    icon: ShieldCheck,
    color: "from-orange-500 to-yellow-500",
  },
  {
    id: "access",
    name: "Share with Access Control",
    description: "Share files with specific users",
    icon: Users,
    color: "from-sky-500 to-blue-600",
  },
];

const SecurityTools = () => {
  const [selectedTool, setSelectedTool] = useState(null);
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Encryption states
  const [password, setPassword] = useState("");
  const [useRandomPassword, setUseRandomPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  // 2FApdfworkstection states
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [protectedFileId, setProtectedFileId] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [protectedFiles, setProtectedFiles] = useState([]);

  // Access Control states
  const [permissions, setPermissions] = useState({
    read: true,
    write: false,
    delete: false,
  });
  const [userEmail, setUserEmail] = useState("");
  const [accessList, setAccessList] = useState([]);
  const [sharedFileId, setSharedFileId] = useState("");
  const [accessUserEmail, setAccessUserEmail] = useState("");
  const [sharedFiles, setSharedFiles] = useState([]);

  const handleToolClick = (tool) => {
    setSelectedTool(tool);
    setFiles([]);
    setDownloadUrl(null);
    setError(null);
    setSuccess(null);
    setPassword("");
    setUseRandomPassword(false);
    setGeneratedPassword("");
    setTwoFactorCode("");
    setQrCodeUrl("");
    setSecretKey("");
    setProtectedFileId("");
    setIdentifier("");
    setPermissions({ read: true, write: false, delete: false });
    setUserEmail("");
    setAccessList([]);
    setSharedFileId("");
    setAccessUserEmail("");
    setProtectedFiles([]);
    setSharedFiles([]);
  };

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Encryption Functions
  const handleEncryption = async () => {
    if (!files.length) {
      setError("Please select a file to encrypt");
      return;
    }
    if (!useRandomPassword && !password) {
      setError("Please enter a password or use random password");
      return;
    }

    setProcessing(true);
    setError(null);
    setDownloadUrl(null);

    const formData = new FormData();
    formData.append("files", files[0]);

    try {
      const response = await fetch(`${API_URL}/api/security/encrypt`, {
        method: "POST",
        headers: useRandomPassword ? {} : { Password: password },
        body: formData,
      });

      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(
          errorResult.error || `Encryption failed: ${response.statusText}`
        );
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setDownloadUrl(url);

      const generatedPwd = response.headers.get("X-Generated-Password");
      if (useRandomPassword && generatedPwd) {
        setGeneratedPassword(generatedPwd);
      }

      setSuccess("File encrypted successfully!");
    } catch (err) {
      console.error("Encryption failed:", err);
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleDecryption = async () => {
    if (!files.length) {
      setError("Please select a file to decrypt");
      return;
    }
    if (!password && !generatedPassword) {
      setError("Please enter the decryption password");
      return;
    }

    setProcessing(true);
    setError(null);
    setDownloadUrl(null);

    const formData = new FormData();
    formData.append("files", files[0]);
    const decryptionPassword = password || generatedPassword;

    try {
      const response = await fetch(`${API_URL}/api/security/decrypt`, {
        method: "POST",
        headers: { Password: decryptionPassword },
        body: formData,
      });

      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(
          errorResult.error || `Decryption failed: ${response.statusText}`
        );
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setDownloadUrl(url);
      setSuccess("File decrypted successfully!");
    } catch (err) {
      console.error("Decryption failed:", err);
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  // 2FApdfworkstection Functions
  const protectPDFWith2FA = async () => {
    if (!files.length) {
      setError("Please select a PDF file to protect");
      return;
    }
    if (!identifier) {
      setError("Please enter an identifier for this PDF");
      return;
    }

    setProcessing(true);
    setError(null);

    const formData = new FormData();
    formData.append("files", files[0]);
    formData.append("identifier", identifier);

    try {
      const response = await fetch(`${API_URL}/api/security/protect-pdf-2fa`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Failed to protect PDF with 2FA");

      setQrCodeUrl(result.qrCode);
      setSecretKey(result.secret);
      setProtectedFileId(result.fileId);
      setSuccess(
        "PDF protected with 2FA successfully! Scan the QR code with your authenticator app."
      );
    } catch (err) {
      console.error("2FApdfworkstection failed:", err);
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const access2FAProtectedPDF = async () => {
    if (!protectedFileId || !twoFactorCode) {
      setError("Please protect a PDF first and enter the 2FA code");
      return;
    }
    if (twoFactorCode.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/security/access-pdf-2fa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId: protectedFileId,
          token: twoFactorCode,
        }),
      });

      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(errorResult.error || "Failed to access protected PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setDownloadUrl(url);
      setSuccess("2FA verification successful! PDF accessed.");
    } catch (err) {
      console.error("2FA PDF access failed:", err);
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const list2FAProtectedFiles = async () => {
    setProcessing(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/security/list-2fa-files`);
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Failed to list protected files");
      setProtectedFiles(result.files || []);
      setSuccess(`Found ${result.total} protected files`);
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const remove2FAProtectedFile = async (fileId) => {
    if (!window.confirm("Are you sure you want to remove this protected file?"))
      return;
    setProcessing(true);
    try {
      const response = await fetch(`${API_URL}/api/security/remove-2fa-file`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Failed to remove protected file");
      setProtectedFiles((prev) =>
        prev.filter((file) => file.fileId !== fileId)
      );
      setSuccess("Protected file removed successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  // Access Control Functions
  const shareFileWithAccess = async () => {
    if (!files.length) {
      setError("Please select a file to share");
      return;
    }
    if (!userEmail) {
      setError("Please enter user email to share with");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      setError("Please enter a valid email address");
      return;
    }

    setProcessing(true);
    setError(null);

    const formData = new FormData();
    formData.append("files", files[0]);
    formData.append("userEmail", userEmail);
    formData.append("permissions", JSON.stringify(permissions));

    try {
      const response = await fetch(`${API_URL}/api/security/share-file`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to share file");

      setSharedFileId(result.fileId);
      setAccessList(result.accessList || []);
      setSuccess(`File shared with ${userEmail} successfully!`);
    } catch (err) {
      console.error("File sharing failed:", err);
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const addUserToFileAccess = async () => {
    if (!sharedFileId || !userEmail) {
      setError("Please share a file first and enter user email");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/security/add-user-access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId: sharedFileId,
          userEmail,
          permissions,
        }),
      });

      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Failed to add user access");

      setAccessList(result.accessList || []);
      setSuccess(`Access granted to ${userEmail} successfully!`);
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  // FIXED: Access Shared File Function
  const accessSharedFile = async () => {
    if (!sharedFileId || !accessUserEmail) {
      setError("Please enter file ID and your email");
      return;
    }

    setProcessing(true);
    setError(null);
    setDownloadUrl(null);

    try {
      const response = await fetch(
        `${API_URL}/api/security/access-shared-file`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileId: sharedFileId,
            userEmail: accessUserEmail,
          }),
        }
      );

      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(errorResult.error || "Failed to access shared file");
      }

      // Get the original filename from headers
      const originalFilename =
        response.headers.get("X-Original-Filename") || "shared_file";
      const fileExtension = response.headers.get("X-File-Extension") || "";

      // Create blob and URL
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setDownloadUrl(url);

      // Set the download filename properly
      setSuccess(
        `File "${originalFilename}" accessed successfully! Ready to download.`
      );
    } catch (err) {
      console.error("Access shared file failed:", err);
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const getFileAccessList = async () => {
    if (!sharedFileId) {
      setError("Please share a file first");
      return;
    }
    setProcessing(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_URL}/api/security/file-access-list?fileId=${sharedFileId}`
      );
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Failed to fetch access list");
      setAccessList(result.accessList || []);
      setSuccess("Access list loaded successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const listSharedFiles = async () => {
    setProcessing(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/security/list-shared-files`);
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Failed to list shared files");
      setSharedFiles(result.files || []);
      setSuccess(`Found ${result.total} shared files`);
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const getDownloadFilename = () => {
    if (!files.length) return "file";
    const originalName = files[0].name;
    if (downloadUrl && originalName.endsWith(".enc")) {
      return `decrypted_${originalName.slice(0, -4)}`;
    } else if (downloadUrl) {
      return `encrypted_${originalName}.enc`;
    }
    return "downloaded_file";
  };

  // FIXED: Get shared file download name
  const getSharedFileDownloadName = () => {
    if (sharedFiles.length > 0 && sharedFileId) {
      const file = sharedFiles.find((f) => f.fileId === sharedFileId);
      return file ? file.originalName : "shared_file";
    }
    return "shared_file";
  };

  if (selectedTool) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-effect rounded-2xl p-8 max-w-6xl mx-auto"
      >
        <div className="flex items-center mb-6">
          <div
            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${selectedTool.color} flex items-center justify-center mr-4`}
          >
            <selectedTool.icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{selectedTool.name}</h2>
            <p className="text-sm text-muted-foreground">
              {selectedTool.description}
            </p>
          </div>
        </div>

        {/* Encryption Tool */}
        {selectedTool.id === "encryption" && (
          <div className="mt-8">
            <label
              htmlFor="file-upload"
              className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-400 rounded-xl cursor-pointer hover:border-blue-500 transition-colors"
            >
              <Upload className="w-10 h-10 text-gray-400 mb-2" />
              <p className="font-semibold text-sm">Click to upload file</p>
              <p className="text-xs text-muted-foreground mt-1">
                Any file type supported
              </p>
              <input
                id="file-upload"
                type="file"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {files.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-semibold text-blue-800 mb-1">
                  Selected File:
                </p>
                <p className="text-sm text-blue-700">{files[0].name}</p>
                <p className="text-xs text-blue-600 mt-1">
                  Size: {formatFileSize(files[0].size)}
                </p>
              </div>
            )}

            <div className="mt-6 space-y-4">
              {/* <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="random-password"
                  checked={useRandomPassword}
                  onChange={(e) => {
                    setUseRandomPassword(e.target.checked);
                    if (e.target.checked) setPassword("");
                  }}
                  className="mr-3 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <label
                  htmlFor="random-password"
                  className="text-sm font-medium text-gray-700"
                >
                  Use randomly generated password
                </label>
              </div> */}

              {!useRandomPassword && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    Encryption Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-2 rounded-md border border-gray-300 text-gray-900 bg-white pr-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter strong password (min 8 characters)"
                      minLength="8"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {generatedPassword && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm font-semibold text-green-800 mb-2 flex items-center">
                    <Lock className="h-4 w-4 mr-2" />
                    Save this password for decryption:
                  </p>
                  <div className="flex items-center justify-between bg-white p-3 rounded border border-green-300">
                    <code className="text-sm font-mono text-green-700 break-all">
                      {generatedPassword}
                    </code>
                    <button
                      onClick={() => copyToClipboard(generatedPassword)}
                      className="ml-3 p-2 hover:bg-green-100 rounded transition-colors"
                      title="Copy to clipboard"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4 text-green-600" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handleEncryption}
                disabled={
                  files.length === 0 ||
                  processing ||
                  (!useRandomPassword && password.length < 8)
                }
                className={`flex-1 px-6 py-3 rounded-full font-bold text-white transition-all flex items-center justify-center ${
                  files.length === 0 ||
                  processing ||
                  (!useRandomPassword && password.length < 8)
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-lg hover:shadow-xl"
                }`}
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Encrypting...
                  </>
                ) : (
                  "Encrypt File"
                )}
              </button>
              <button
                onClick={handleDecryption}
                disabled={
                  files.length === 0 ||
                  processing ||
                  (!password && !generatedPassword)
                }
                className={`flex-1 px-6 py-3 rounded-full font-bold text-white transition-all flex items-center justify-center ${
                  files.length === 0 ||
                  processing ||
                  (!password && !generatedPassword)
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 shadow-lg hover:shadow-xl"
                }`}
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Decrypting...
                  </>
                ) : (
                  "Decrypt File"
                )}
              </button>
            </div>
          </div>
        )}

        {/* 2FApdfworkstection Tool */}
        {selectedTool.id === "auth" && (
          <div className="mt-8 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <label className="block text-sm font-semibold mb-2 text-blue-800">
                    PDF Identifier
                  </label>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full px-4 py-2 rounded-md border border-blue-300 text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter a name for this PDF"
                  />
                  <p className="text-xs text-blue-600 mt-1">
                    This will be displayed in your authenticator app
                  </p>
                </div>

                <label
                  htmlFor="pdf-upload"
                  className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-400 rounded-xl cursor-pointer hover:border-blue-500 transition-colors"
                >
                  <FileText className="w-10 h-10 text-gray-400 mb-2" />
                  <p className="font-semibold text-sm">
                    Click to upload PDF file
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Only PDF files supported for 2FA protection
                  </p>
                  <input
                    id="pdf-upload"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                {files.length > 0 && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-semibold text-blue-800 mb-1">
                      Selected PDF:
                    </p>
                    <p className="text-sm text-blue-700">{files[0].name}</p>
                    <p className="text-xs text-blue-600 mt-1">
                      Size: {formatFileSize(files[0].size)}
                    </p>
                  </div>
                )}

                <button
                  onClick={protectPDFWith2FA}
                  disabled={processing || !files.length || !identifier}
                  className={`w-full px-6 py-3 rounded-full font-bold text-white transition-all flex items-center justify-center ${
                    processing || !files.length || !identifier
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 shadow-lg hover:shadow-xl"
                  }`}
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Protecting...
                    </>
                  ) : (
                    "Protect PDF with 2FA"
                  )}
                </button>
              </div>

              <div className="space-y-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    File ID to Access
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={protectedFileId}
                      onChange={(e) => setProtectedFileId(e.target.value)}
                      className="flex-1 px-4 py-2 rounded-md border border-gray-300 text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter File ID or use from list below"
                    />
                    <button
                      onClick={list2FAProtectedFiles}
                      disabled={processing}
                      className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:bg-gray-400 transition-colors flex items-center"
                    >
                      <List className="h-4 w-4 mr-1" />
                      List Files
                    </button>
                  </div>
                </div>

                {protectedFiles.length > 0 && (
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h3 className="text-lg font-semibold mb-3 text-purple-800">
                      Your Protected Files
                    </h3>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {protectedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="p-3 bg-white rounded border border-purple-200"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-semibold text-sm text-gray-800">
                                {file.originalName}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                ID:{" "}
                                <code className="bg-gray-100 px-1 rounded">
                                  {file.fileId}
                                </code>
                              </p>
                              <p className="text-xs text-gray-600">
                                Size: {formatFileSize(file.fileSize)}
                              </p>
                            </div>
                            <div className="flex gap-2 ml-2">
                              <button
                                onClick={() => {
                                  setProtectedFileId(file.fileId);
                                  setSuccess(
                                    `File ID "${file.fileId}" set successfully!`
                                  );
                                }}
                                className="text-xs bg-blue-500 text-white hover:bg-blue-600 px-2 py-1 rounded transition-colors"
                              >
                                Use ID
                              </button>
                              <button
                                onClick={() =>
                                  remove2FAProtectedFile(file.fileId)
                                }
                                className="text-xs bg-red-500 text-white hover:bg-red-600 px-2 py-1 rounded transition-colors"
                                title="Remove file"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-4 border border-yellow-200 rounded-xl bg-yellow-50">
                  <h3 className="text-lg font-semibold mb-3 text-yellow-800 flex items-center">
                    <ShieldCheck className="h-5 w-5 mr-2" />
                    Access Protected PDF
                  </h3>
                  <div className="p-3 bg-white rounded-lg border border-yellow-200">
                    <label className="block text-sm font-semibold mb-2 text-gray-700">
                      Enter 6-digit code from your authenticator app:
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={twoFactorCode}
                        onChange={(e) =>
                          setTwoFactorCode(
                            e.target.value.replace(/\D/g, "").slice(0, 6)
                          )
                        }
                        className="flex-1 px-4 py-3 rounded-md border border-gray-300 text-gray-900 bg-white text-center text-lg font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="123456"
                        maxLength={6}
                      />
                      <button
                        onClick={access2FAProtectedPDF}
                        disabled={
                          processing ||
                          twoFactorCode.length !== 6 ||
                          !protectedFileId
                        }
                        className={`px-6 py-3 font-semibold transition-colors ${
                          processing ||
                          twoFactorCode.length !== 6 ||
                          !protectedFileId
                            ? "bg-gray-400 cursor-not-allowed text-white"
                            : "bg-green-500 text-white hover:bg-green-600"
                        }`}
                      >
                        Access PDF
                      </button>
                    </div>
                  </div>
                </div>

                {qrCodeUrl && (
                  <div className="p-4 border border-green-200 rounded-xl bg-green-50">
                    <h3 className="text-lg font-semibold mb-3 text-green-800 flex items-center">
                      <ShieldCheck className="h-5 w-5 mr-2" />
                      Newpdfworkstected Successfully!
                    </h3>
                    <div className="flex flex-col items-center">
                      <img
                        src={qrCodeUrl}
                        alt="QR Code for 2FA"
                        className="w-40 h-40 mb-3 border-2 border-green-300 rounded-lg"
                      />
                      <p className="text-sm text-green-700 mb-2 text-center">
                        Scan this QR code with your authenticator app
                      </p>
                      <div className="w-full">
                        <p className="text-sm font-semibold text-green-800 mb-2">
                          Secret Key (for manual entry):
                        </p>
                        <div className="flex items-center bg-white p-3 rounded-lg border border-green-300">
                          <code className="text-sm font-mono text-green-700 flex-1 break-all">
                            {secretKey}
                          </code>
                          <button
                            onClick={() => copyToClipboard(secretKey)}
                            className="ml-3 p-2 hover:bg-green-100 rounded transition-colors"
                            title="Copy secret key"
                          >
                            {copied ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4 text-green-600" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Access Control Tool */}
        {selectedTool.id === "access" && (
          <div className="mt-8 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <Upload className="h-5 w-5 mr-2" />
                  Share File
                </h3>

                <label
                  htmlFor="share-upload"
                  className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-400 rounded-xl cursor-pointer hover:border-blue-500 transition-colors"
                >
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="font-semibold text-sm">Upload file to share</p>
                  <input
                    id="share-upload"
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                {files.length > 0 && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-semibold text-blue-800">
                      Selected File:
                    </p>
                    <p className="text-sm text-blue-700">{files[0].name}</p>
                    <p className="text-xs text-blue-600 mt-1">
                      Size: {formatFileSize(files[0].size)}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    Share with Email
                  </label>
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="w-full px-4 py-2 rounded-md border border-gray-300 text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter user email"
                  />
                </div>

                <div className="p-4 border border-gray-200 rounded-xl bg-white">
                  <h4 className="text-sm font-semibold mb-3 text-gray-800">
                    Permissions
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(permissions).map(
                      ([permission, enabled]) => (
                        <div key={permission} className="flex items-center">
                          <input
                            type="checkbox"
                            id={permission}
                            checked={enabled}
                            onChange={(e) =>
                              setPermissions((prev) => ({
                                ...prev,
                                [permission]: e.target.checked,
                              }))
                            }
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 mr-2"
                          />
                          <label
                            htmlFor={permission}
                            className="text-sm text-gray-700 capitalize"
                          >
                            {permission}
                          </label>
                        </div>
                      )
                    )}
                  </div>
                </div>

                <button
                  onClick={shareFileWithAccess}
                  disabled={processing || !files.length || !userEmail}
                  className={`w-full px-6 py-3 rounded-full font-bold text-white transition-all flex items-center justify-center ${
                    processing || !files.length || !userEmail
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 shadow-lg hover:shadow-xl"
                  }`}
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sharing...
                    </>
                  ) : (
                    "Share File"
                  )}
                </button>

                {sharedFileId && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm font-semibold text-green-800">
                      File Shared Successfully!
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      File ID:{" "}
                      <code className="bg-green-100 px-1 rounded">
                        {sharedFileId}
                      </code>
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Manage Access
                </h3>

                <div className="flex gap-2">
                  <button
                    onClick={listSharedFiles}
                    disabled={processing}
                    className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:bg-gray-400 transition-colors flex items-center justify-center"
                  >
                    <List className="h-4 w-4 mr-2" />
                    List Shared Files
                  </button>
                </div>

                {sharedFiles.length > 0 && (
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <h4 className="text-sm font-semibold mb-2 text-purple-800">
                      Shared Files
                    </h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {sharedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="p-2 bg-white rounded border border-purple-200"
                        >
                          <p className="font-semibold text-xs">
                            {file.originalName}
                          </p>
                          <p className="text-xs text-gray-600">
                            ID:{" "}
                            <code className="bg-gray-100 px-1 rounded">
                              {file.fileId}
                            </code>
                          </p>
                          <button
                            onClick={() => setSharedFileId(file.fileId)}
                            className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                          >
                            Use this ID
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="flex-1 px-4 py-2 rounded-md border border-gray-300 text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Add user email"
                  />
                  <button
                    onClick={addUserToFileAccess}
                    disabled={processing || !sharedFileId || !userEmail}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
                  >
                    Add User
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={sharedFileId}
                    onChange={(e) => setSharedFileId(e.target.value)}
                    className="flex-1 px-4 py-2 rounded-md border border-gray-300 text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter File ID"
                  />
                  <button
                    onClick={getFileAccessList}
                    disabled={processing}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:bg-gray-400 transition-colors"
                  >
                    Get Access
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="email"
                    value={accessUserEmail}
                    onChange={(e) => setAccessUserEmail(e.target.value)}
                    className="flex-1 px-4 py-2 rounded-md border border-gray-300 text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your email to access file"
                  />
                  <button
                    onClick={accessSharedFile}
                    disabled={processing || !sharedFileId || !accessUserEmail}
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-400 transition-colors"
                  >
                    Access File
                  </button>
                </div>

                {accessList.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold mb-2 text-gray-800">
                      Access List
                    </h4>
                    <div className="space-y-2">
                      {accessList.map((user, index) => (
                        <div
                          key={index}
                          className="p-3 border border-gray-200 rounded-lg bg-white"
                        >
                          <p className="font-semibold text-sm">{user.email}</p>
                          <div className="flex gap-2 mt-1">
                            {Object.entries(user.permissions || {}).map(
                              ([perm, enabled]) => (
                                <span
                                  key={perm}
                                  className={`text-xs px-2 py-1 rounded ${
                                    enabled
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {perm}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Download Section */}
        {(downloadUrl || success || error) && (
          <div className="mt-6 space-y-4">
            {downloadUrl && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-green-800 font-semibold mb-3 flex items-center">
                  <Check className="h-5 w-5 mr-2" />
                  {success}
                </p>
                <a
                  href={downloadUrl}
                  download={
                    selectedTool.id === "access"
                      ? getSharedFileDownloadName()
                      : getDownloadFilename()
                  }
                  className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors font-semibold"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download{" "}
                  {selectedTool.id === "access" ? "Shared File" : "File"}
                </a>
              </div>
            )}

            {success && !downloadUrl && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-green-800 font-semibold flex items-center">
                  <Check className="h-5 w-5 mr-2" />
                  {success}
                </p>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-red-800 font-semibold flex items-center">
                  <span className="text-lg mr-2">⚠️</span>
                  {error}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={() => setSelectedTool(null)}
            className="w-full px-6 py-3 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors font-medium"
          >
            ← Back to Security Tools
          </button>
        </div>
      </motion.div>
    );
  }

  const metaPropsData = {
    title:
      "Free PDF Security Tools | Encrypt, 2FA Protect, Share PDFs - PDF Works",
    description:
      "100% free PDF security tools. Encrypt PDF files with AES encryption, protect with 2FA authenticator, share with access control. No registration required, completely free PDF security utilities.",
    keyword:
      "free pdf security, encrypt pdf free, pdf encryption free, free 2fa pdf, protect pdf with 2fa free, share pdf with access control free, free pdf protection, secure pdf free, free document security, no cost pdf security, free online encryption, free pdf access control, completely free security tools, free file encryption, free digital security",
    image:
      "https://res.cloudinary.com/dcfjt8shw/image/upload/v1761288318/wn8m8g8skdpl6iz2rwoa.svg",
    url: "https://pdfworks.in/tools/",
  };

  return (
    <>
      <Metatags metaProps={metaPropsData} />
      <div className="flex justify-start w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {tools.map((tool, i) => {
            const Icon = tool.icon;
            return (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.05, y: -5 }}
                onClick={() => handleToolClick(tool)}
                className="glass-effect rounded-2xl p-6 cursor-pointer transition-all group h-full flex flex-col"
              >
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-4`}
                >
                  <Icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-lg font-bold mb-2">{tool.name}</h3>
                <p className="text-sm text-muted-foreground flex-grow">
                  {tool.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default SecurityTools;
