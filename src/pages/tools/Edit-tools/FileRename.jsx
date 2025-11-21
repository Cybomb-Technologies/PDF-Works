import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Download,
  Upload,
  Edit3,
  X,
  FileText,
  Eye,
  EyeOff,
  RotateCcw,
  Archive
} from "lucide-react";
import { useNotification } from "@/contexts/NotificationContext";

const API_URL = import.meta.env.VITE_API_URL;

const FileRename = () => {
  const [files, setFiles] = useState([]);
  const [pattern, setPattern] = useState("file_{index}");
  const [batchName, setBatchName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [renamedFiles, setRenamedFiles] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState("");
  const [fileSaved, setFileSaved] = useState(false);
  const [batchId, setBatchId] = useState("");
  const fileInputRef = useRef(null);

  const { showNotification } = useNotification();

  // Get token from localStorage
  const getToken = () => {
    return localStorage.getItem("token");
  };

  const handleFileUpload = (event) => {
    const newFiles = Array.from(event.target.files);
    const fileObjects = newFiles.map((file) => ({
      file,
      originalName: file.name,
      newName: file.name, // Start with original name
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file),
    }));
    setFiles((prev) => [...prev, ...fileObjects]);
    setError("");
    
    showNotification({
      type: 'success',
      title: 'Files Selected',
      message: `${newFiles.length} file(s) ready for renaming`,
      duration: 3000
    });
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    showNotification({
      type: 'info',
      title: 'File Removed',
      message: 'File removed from selection',
      duration: 2000
    });
  };

  const generateNewFilename = (originalName, index, pattern) => {
    const extension = originalName.slice(originalName.lastIndexOf("."));
    const nameWithoutExt = originalName.slice(0, originalName.lastIndexOf("."));

    let newName = pattern
      .replace(/{original}/g, nameWithoutExt)
      .replace(/{index}/g, (index + 1).toString().padStart(2, "0"))
      .replace(/{timestamp}/g, Date.now().toString())
      .replace(/{date}/g, new Date().toISOString().split("T")[0]);

    return newName + extension;
  };

  const previewRename = () => {
    if (files.length === 0) {
      setError("Please upload files first");
      showNotification({
        type: 'error',
        title: 'No Files',
        message: 'Please upload files first',
        duration: 4000
      });
      return;
    }

    if (!pattern.trim()) {
      setError("Please enter a naming pattern");
      showNotification({
        type: 'error',
        title: 'Pattern Required',
        message: 'Please enter a naming pattern',
        duration: 4000
      });
      return;
    }

    const updatedFiles = files.map((fileObj, index) => ({
      ...fileObj,
      newName: generateNewFilename(fileObj.originalName, index, pattern),
    }));

    setFiles(updatedFiles);
    setRenamedFiles(updatedFiles);
    setShowPreview(true);
    setError("");
    
    showNotification({
      type: 'success',
      title: 'Preview Generated',
      message: 'Check the preview before renaming',
      duration: 4000
    });
  };

  const handleRename = async () => {
    if (files.length === 0) {
      setError("Please upload files first");
      showNotification({
        type: 'error',
        title: 'No Files',
        message: 'Please upload files first',
        duration: 4000
      });
      return;
    }

    setIsProcessing(true);
    setError("");

    showNotification({
      type: 'info',
      title: 'Processing Files',
      message: 'Renaming and saving your files...',
      duration: 0,
      autoClose: false
    });

    try {
      // Prepare files data for backend
      const filesData = files.map((fileObj, index) => ({
        originalName: fileObj.originalName,
        newName: generateNewFilename(fileObj.originalName, index, pattern),
        pattern: pattern
      }));

      // Convert all files to blobs and create FormData
      const formData = new FormData();
      
      // Add each file
      for (let i = 0; i < files.length; i++) {
        const fileObj = files[i];
        const response = await fetch(fileObj.url);
        const blob = await response.blob();
        formData.append("files", blob, fileObj.originalName);
      }
      
      // Add files data as JSON
      formData.append("filesData", JSON.stringify(filesData));
      formData.append("batchName", batchName || `File Rename ${new Date().toLocaleDateString()}`);

      // Save to Edit model as batch
      const saveResult = await saveToEditModelBatch(formData);

      // Handle limit exceeded error
      if (!saveResult.success && saveResult.type === 'limit_exceeded') {
        setError(saveResult.message || "Edit tools limit reached");
        
        // Show notification
        showNotification({
          type: 'error',
          title: saveResult.title || 'Usage Limit Reached',
          message: saveResult.message || saveResult.reason,
          duration: 8000,
          currentUsage: saveResult.currentUsage,
          limit: saveResult.limit,
          upgradeRequired: saveResult.upgradeRequired,
          action: saveResult.upgradeRequired ? {
            label: 'Upgrade Plan',
            onClick: () => window.open('/pricing', '_blank'),
            external: true
          } : null
        });
        return;
      }

      if (saveResult.success) {
        setFileSaved(true);
        setBatchId(saveResult.batchId);
        
        console.log('✅ [FRONTEND] Batch saved successfully:', {
          batchId: saveResult.batchId,
          totalFiles: files.length,
          savedRecords: saveResult.savedRecords
        });
        
        const processedFiles = files.map((fileObj, index) => ({
          ...fileObj,
          newName: generateNewFilename(fileObj.originalName, index, pattern),
        }));

        setFiles(processedFiles);
        setRenamedFiles(processedFiles);
        
        showNotification({
          type: 'success',
          title: 'Files Renamed Successfully! 🎉',
          message: `${files.length} file(s) renamed and saved as batch`,
          duration: 5000
        });
      } else {
        setError("Failed to save files: " + saveResult.error);
        showNotification({
          type: 'error',
          title: 'Rename Failed',
          message: 'Failed to rename files: ' + saveResult.error,
          duration: 5000
        });
      }

    } catch (error) {
      console.error("Error:", error);
      setError("Failed to rename files: " + error.message);
      showNotification({
        type: 'error',
        title: 'Processing Error',
        message: 'Failed to rename files: ' + error.message,
        duration: 5000
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Save multiple files as batch to Edit model
  const saveToEditModelBatch = async (formData) => {
    try {
      const token = getToken();
      if (!token) {
        showNotification({
          type: 'error',
          title: 'Authentication Required',
          message: 'Please log in to save files',
          duration: 5000
        });
        return { success: false, error: "Please log in to save files" };
      }

      const response = await fetch(`${API_URL}/api/tools/pdf-editor/save-file-rename`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save to Edit model: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Save to Edit model error:", error);
      return { success: false, error: error.message };
    }
  };

  // Download entire batch as ZIP
  const downloadBatch = async () => {
    try {
      console.log('🔍 [FRONTEND] Starting batch download:', batchId);
      
      const token = getToken();
      if (!token) {
        setError("Please log in to download files");
        showNotification({
          type: 'error',
          title: 'Authentication Required',
          message: 'Please log in to download files',
          duration: 5000
        });
        return;
      }

      showNotification({
        type: 'info',
        title: 'Preparing Download',
        message: 'Creating ZIP archive...',
        duration: 0,
        autoClose: false
      });

      const response = await fetch(`${API_URL}/api/tools/pdf-editor/download-batch/${batchId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ [FRONTEND] Batch download failed:', errorData);
        throw new Error(errorData.error || 'Failed to download batch');
      }

      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `file-batch-${batchId}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log("✅ [FRONTEND] Batch download completed successfully");

      showNotification({
        type: 'success',
        title: 'Download Started',
        message: 'ZIP archive download started',
        duration: 3000
      });

    } catch (error) {
      console.error('❌ [FRONTEND] Download batch error:', error);
      setError('Failed to download batch: ' + error.message);
      showNotification({
        type: 'error',
        title: 'Download Failed',
        message: 'Failed to download batch: ' + error.message,
        duration: 5000
      });
    }
  };

  // Download individual file
  const downloadFile = (fileObj) => {
    const link = document.createElement("a");
    link.href = fileObj.url;
    link.download = fileObj.newName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification({
      type: 'success',
      title: 'Download Started',
      message: `Downloading ${fileObj.newName}`,
      duration: 3000
    });
  };

  const handleReset = () => {
    // Clean up object URLs
    files.forEach((fileObj) => {
      if (fileObj.url) {
        URL.revokeObjectURL(fileObj.url);
      }
    });

    setFiles([]);
    setRenamedFiles([]);
    setShowPreview(false);
    setError("");
    setPattern("file_{index}");
    setBatchName("");
    setFileSaved(false);
    setBatchId("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    
    showNotification({
      type: 'info',
      title: 'Reset',
      message: 'Ready to rename another batch',
      duration: 3000
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith("image/")) return "🖼️";
    if (fileType.includes("pdf")) return "📄";
    if (fileType.includes("word") || fileType.includes("document")) return "📝";
    if (fileType.includes("zip") || fileType.includes("archive")) return "📦";
    if (fileType.includes("video")) return "🎬";
    if (fileType.includes("audio")) return "🎵";
    return "📁";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-effect rounded-2xl p-8 max-w-6xl mx-auto"
    >
      <div className="flex items-center mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center mr-4">
          <Edit3 className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold">File Rename</h2>
          <p className="text-sm text-muted-foreground">
            Batch rename your files - Files are saved as a single batch
          </p>
        </div>
      </div>

      {renamedFiles.length > 0 ? (
        <div className="text-center mt-8">
          <h3 className="text-lg font-bold mb-4">Your files are renamed! 🎉</h3>

          {/* File Saved Status */}
          {fileSaved && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-sm font-medium">
                ✅ Files automatically saved as <strong>Batch</strong> to Edit History
              </p>
              <p className="text-green-600 text-xs mt-1">
                Batch ID: {batchId} • {files.length} files
              </p>
            </div>
          )}

          {/* Download Batch as ZIP Button */}
          <div className="mb-6">
            <button
              onClick={downloadBatch}
              className="inline-flex items-center justify-center px-6 py-3 rounded-full text-white bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 transition-all font-semibold"
            >
              <Archive className="h-5 w-5 mr-2" />
              Download All as ZIP
            </button>
            <p className="text-xs text-muted-foreground mt-2">
              Download all {files.length} files as a single ZIP archive
            </p>
          </div>

          {/* Individual file download section */}
          <div className="mt-4">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors mb-4"
            >
              {showPreview ? (
                <EyeOff className="h-4 w-4 mr-2" />
              ) : (
                <Eye className="h-4 w-4 mr-2" />
              )}
              {showPreview ? "Hide File List" : "Show Individual Files"}
            </button>

            {showPreview && (
              <div className="mb-6 p-4 border border-gray-300 rounded-lg bg-white">
                <h4 className="text-sm font-semibold mb-3 text-center">
                  Renamed Files ({renamedFiles.length})
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {renamedFiles.map((fileObj, index) => (
                    <div
                      key={index}
                      className="p-3 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="text-sm">
                        <div className="flex items-center gap-2 text-gray-500 mb-1">
                          <FileText className="h-3 w-3" />
                          <span className="line-through text-xs">
                            {fileObj.originalName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 font-medium text-green-600">
                          <Edit3 className="h-3 w-3" />
                          <span className="text-sm">{fileObj.newName}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => downloadFile(fileObj)}
                        className="mt-2 w-full py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                      >
                        Download Individual
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Start Over Button */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={handleReset}
              className="px-6 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
            >
              Start over
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-8">
          {/* Batch Name Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Batch Name (Optional)
            </label>
            <input
              type="text"
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="e.g., Project Documents, Vacation Photos, etc."
            />
            <p className="text-xs text-muted-foreground mt-1">
              Give a name to this batch for easier identification in your history
            </p>
          </div>

          {/* File Upload */}
          <label
            htmlFor="file-upload"
            className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-400 rounded-xl cursor-pointer hover:border-purple-500 transition-colors mb-6"
          >
            <Upload className="w-10 h-10 text-gray-400 mb-2" />
            <p className="font-semibold text-sm">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Multiple files supported • Files will be saved as a batch
            </p>
            <input
              id="file-upload"
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {error && (
            <p className="text-red-500 text-sm text-center mb-4">{error}</p>
          )}

          {/* File List */}
          {files.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium text-sm">
                  Selected Files ({files.length})
                </h3>
                <button
                  onClick={() => setFiles([])}
                  className="text-sm text-red-500 hover:text-red-700 transition-colors"
                >
                  Clear All
                </button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {files.map((fileObj, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-lg">
                        {getFileIcon(fileObj.type)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">
                          {fileObj.originalName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatFileSize(fileObj.size)} •{" "}
                          {fileObj.type || "Unknown type"}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors ml-2"
                      title="Remove file"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Naming Pattern */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Naming Pattern
            </label>
            <input
              type="text"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter naming pattern"
            />
            <div className="text-xs text-muted-foreground mt-3 space-y-2">
              <p className="font-medium">Available variables:</p>
              <div className="flex gap-2 flex-wrap">
                <code className="bg-gray-100 px-2 py-1 rounded border text-purple-600">
                  &#123;original&#125;
                </code>
                <code className="bg-gray-100 px-2 py-1 rounded border text-purple-600">
                  &#123;index&#125;
                </code>
                <code className="bg-gray-100 px-2 py-1 rounded border text-purple-600">
                  &#123;timestamp&#125;
                </code>
                <code className="bg-gray-100 px-2 py-1 rounded border text-purple-600">
                  &#123;date&#125;
                </code>
              </div>
              <p className="text-green-600 font-medium">
                ✓ Files will be saved as a single batch in your history
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={previewRename}
              disabled={files.length === 0}
              className="flex items-center gap-2 px-6 py-3 rounded-full font-bold text-white bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 transition-all"
            >
              <Eye className="h-4 w-4" />
              Preview Rename
            </button>

            <button
              onClick={handleRename}
              disabled={isProcessing || files.length === 0}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-white transition-all ${
                isProcessing || files.length === 0
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Edit3 className="h-4 w-4" />
                  Rename & Save Batch
                </>
              )}
            </button>

            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default FileRename;