import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FileType,
  Image,
  FileText,
  Upload,
  Download,
  ChevronDown,
  Eye,
  EyeOff,
} from "lucide-react";
const API_URL = import.meta.env.VITE_API_URL;

const tools = [
  {
    id: "convert",
    name: "Convert to PDF",
    description: "Word, Excel, PPT, Images → PDF",
    icon: FileType,
    color: "from-orange-500 to-red-500",
    accept: ".docx,.doc,.xlsx,.xls,.pptx,.ppt,.jpg,.jpeg,.png",
    fileType: "Document/Image",
  },
  {
    id: "pdf-to-image",
    name: "PDF to Image",
    description: "Convert PDF pages to JPG/PNG",
    icon: Image,
    color: "from-pink-500 to-rose-500",
    accept: ".pdf",
    fileType: "PDF",
  },
  {
    id: "image-to-pdf",
    name: "Image to PDF",
    description: "Create PDF from images",
    icon: FileText,
    color: "from-indigo-500 to-purple-500",
    accept: ".jpg,.jpeg,.png",
    fileType: "Image",
  },
];

const ConvertTools = () => {
  const [selectedTool, setSelectedTool] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionResult, setConversionResult] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [fileSaved, setFileSaved] = useState(false);

  // Get token from localStorage
  const getToken = () => {
    return localStorage.getItem("token");
  };

  const handleToolClick = (tool) => {
    setSelectedTool(tool);
    setUploadedFile(null);
    setConversionResult(null);
    setIsConverting(false);
    setShowPreview(false);
    setDownloadUrl(null);
    setFileSaved(false);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedFile(file);
      setConversionResult(null);
      setDownloadUrl(null);
      setFileSaved(false);
    }
  };

  // FIXED: Function to save converted file to My Files with authentication
  const saveToMyFiles = async (fileBlob, filename, toolUsed) => {
    try {
      // Get token from localStorage
      const token = getToken();

      if (!token) {
        return { success: false, error: "Please log in to save files" };
      }

      // Convert blob to base64 for sending to backend
      const reader = new FileReader();

      return new Promise((resolve, reject) => {
        reader.onloadend = async () => {
          const base64data = reader.result;

          try {
            const saveResponse = await fetch(
              `${API_URL}/api/files/save-converted`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  originalName: filename,
                  fileBuffer: base64data,
                  mimetype: fileBlob.type,
                  toolUsed: toolUsed,
                }),
              }
            );

            if (!saveResponse.ok) {
              if (saveResponse.status === 401) {
                localStorage.removeItem("token");
                resolve({
                  success: false,
                  error: "Session expired. Please log in again.",
                });
                return;
              }
              throw new Error(`Failed to save file: ${saveResponse.status}`);
            }

            const saveResult = await saveResponse.json();

            if (saveResult.success) {
              setFileSaved(true);
              resolve(saveResult);
            } else {
              resolve({ success: false, error: saveResult.error });
            }
          } catch (error) {
            resolve({ success: false, error: error.message });
          }
        };

        reader.onerror = () => {
          resolve({ success: false, error: "File reading failed" });
        };

        reader.readAsDataURL(fileBlob);
      });
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const handleConvert = async () => {
    if (!uploadedFile || !selectedTool) return;

    setIsConverting(true);
    setConversionResult(null);
    setDownloadUrl(null);
    setFileSaved(false);

    try {
      const token = getToken();
      if (!token) {
        alert("Please log in to convert files");
        setIsConverting(false);
        return;
      }

      const formData = new FormData();
      formData.append("file", uploadedFile);

      let endpoint = "";

      switch (selectedTool.id) {
        case "convert":
          endpoint = "/api/convert/to-pdf";
          break;
        case "pdf-to-image":
          endpoint = "/api/convert/pdf-to-image";
          formData.append("imageFormat", "jpg");
          break;
        case "image-to-pdf":
          endpoint = "/api/convert/image-to-pdf";
          break;
        default:
          throw new Error("Invalid tool selected");
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const contentType = response.headers.get("content-type");

      let blob;
      let filename = "converted-file";

      // Handle file download response
      if (contentType && contentType.includes("application/pdf")) {
        blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        setDownloadUrl(url);

        // Get filename from Content-Disposition header
        const contentDisposition = response.headers.get("content-disposition");
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        }
      }
      // Handle JSON response (for errors or other info)
      else if (contentType && contentType.includes("application/json")) {
        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error || `HTTP error! status: ${response.status}`
          );
        }

        if (result.success) {
          setConversionResult(result);
          // If the result contains a download URL, create object URL for preview
          if (result.downloadUrl) {
            const downloadResponse = await fetch(
              `${API_URL}${result.downloadUrl}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            blob = await downloadResponse.blob();
            const url = window.URL.createObjectURL(blob);
            setDownloadUrl(url);

            // Extract filename from download URL or use default
            const urlParts = result.downloadUrl.split("/");
            filename = result.convertedFilename || filename;
          }
        } else {
          throw new Error(result.error || "Conversion failed");
        }
      } else {
        // Handle other file types (images, etc.)
        blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        setDownloadUrl(url);

        const contentDisposition = response.headers.get("content-disposition");
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        }
      }

      // Save the converted file to My Files
      if (blob) {
        try {
          await saveToMyFiles(blob, filename, selectedTool.id);
        } catch (saveError) {
          // Don't fail the conversion if saving fails
        }
      }

      setConversionResult({
        success: true,
        convertedFilename: filename,
        downloadUrl: downloadUrl,
      });
    } catch (error) {
      alert(`Conversion failed: ${error.message}`);
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = async () => {
    if (!conversionResult || !downloadUrl) return;

    try {
      const token = getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await fetch(downloadUrl, { headers });
      const blob = await response.blob();

      const a = document.createElement("a");
      a.style.display = "none";
      a.href = downloadUrl;
      a.download = conversionResult.convertedFilename || "converted-file";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      alert(`Download failed: ${error.message}`);
    }
  };

  const resetConversion = () => {
    setSelectedTool(null);
    setUploadedFile(null);
    setConversionResult(null);
    setIsConverting(false);
    setShowPreview(false);
    setDownloadUrl(null);
    setFileSaved(false);
  };

  if (selectedTool) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-effect rounded-2xl p-8 max-w-4xl mx-auto"
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

        {!conversionResult ? (
          <div className="mt-8">
            <label
              htmlFor="file-upload"
              className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-400 rounded-xl cursor-pointer hover:border-blue-500 transition-colors"
            >
              <Upload className="w-10 h-10 text-gray-400 mb-2" />
              <p className="font-semibold text-sm">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedTool.fileType} files
              </p>
              <input
                id="file-upload"
                type="file"
                onChange={handleFileUpload}
                accept={selectedTool.accept}
                className="hidden"
              />
            </label>

            {uploadedFile && (
              <div className="mt-4">
                <p className="text-sm font-semibold mb-2">Selected File:</p>
                <p className="text-sm text-muted-foreground">
                  {uploadedFile.name} (
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              </div>
            )}

            <p className="text-xs text-muted-foreground mt-4 text-center">
              {selectedTool.id === "convert"
                ? "Supports Word, Excel, PowerPoint, and Image files"
                : selectedTool.id === "image-to-pdf"
                ? "Supports JPG, JPEG, and PNG files"
                : "Please upload a PDF file"}
            </p>

            {uploadedFile && (
              <button
                onClick={handleConvert}
                disabled={isConverting}
                className={`w-full mt-6 px-6 py-3 rounded-full font-bold text-white transition-all ${
                  isConverting
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                }`}
              >
                {isConverting
                  ? "Converting..."
                  : `Convert to ${
                      selectedTool.name.includes("to PDF")
                        ? "PDF"
                        : selectedTool.name.replace("PDF to ", "")
                    }`}
              </button>
            )}

            <button
              onClick={resetConversion}
              className="w-full mt-4 px-6 py-2 text-sm text-muted-foreground hover:bg-gray-100 rounded-full transition-colors"
            >
              Back to tools
            </button>
          </div>
        ) : (
          <div className="text-center mt-8">
            <h3 className="text-lg font-bold mb-4">
              Conversion Successful! 🎉
            </h3>

            {/* File Saved Status */}
            {fileSaved && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700 text-sm font-medium">
                  ✅ File automatically saved to <strong>My Files</strong>{" "}
                  section
                </p>
              </div>
            )}

            {/* Preview Toggle */}
            <div className="flex justify-center mb-4">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                {showPreview ? (
                  <EyeOff className="h-4 w-4 mr-2" />
                ) : (
                  <Eye className="h-4 w-4 mr-2" />
                )}
                {showPreview ? "Hide Preview" : "Show Preview"}
              </button>
            </div>

            {/* File Preview */}
            {showPreview && downloadUrl && (
              <div className="mb-6 p-4 border border-gray-300 rounded-lg bg-white">
                <h4 className="text-sm font-semibold mb-3 text-center">
                  File Preview
                </h4>
                <div className="flex justify-center">
                  <iframe
                    src={downloadUrl}
                    className="w-full h-96 max-w-2xl border border-gray-200 rounded"
                    title="File Preview"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Note: Preview may not work in all browsers. Download to view
                  the full file.
                </p>
              </div>
            )}

            {/* Download Button */}
            <button
              onClick={handleDownload}
              className="inline-flex items-center justify-center px-6 py-3 rounded-full text-white bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 transition-all font-semibold"
            >
              <Download className="h-5 w-5 mr-2" />
              Download {conversionResult.convertedFilename || "Converted File"}
            </button>

            {/* Start Over Button */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={resetConversion}
                className="px-6 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
              >
                Convert another file
              </button>
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  return (
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
  );
};

export default ConvertTools;
