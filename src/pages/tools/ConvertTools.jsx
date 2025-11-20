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
import { useNotification } from "@/contexts/NotificationContext";
import Metatags from "../../SEO/metatags";

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

  const { showNotification } = useNotification();

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

      showNotification({
        type: "success",
        title: "File Selected",
        message: `${file.name} ready for conversion`,
        duration: 3000,
      });
    }
  };

  const saveToMyFiles = async (fileBlob, filename, toolUsed) => {
    try {
      const token = getToken();

      if (!token) {
        return { success: false, error: "Please log in to save files" };
      }

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
        showNotification({
          type: "error",
          title: "Authentication Required",
          message: "Please log in to convert files",
          duration: 5000,
        });
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
      let result;

      // Try to parse JSON response first (for errors and success messages)
      if (contentType && contentType.includes("application/json")) {
        result = await response.json();

        // Handle backend errors with detailed messages
        if (!response.ok || !result.success) {
          // Use the detailed error information from backend
          const errorTitle = result.title || "Conversion Failed";
          const errorMessage =
            result.message ||
            result.error ||
            result.details ||
            "Unknown error occurred";
          const errorType = result.type || "conversion_error";

          // Special handling for limit exceeded
          if (errorType === "limit_exceeded") {
            showNotification({
              type: "error",
              title: errorTitle,
              message: errorMessage,
              duration: 8000,
            });

            // Show upgrade suggestion
            setTimeout(() => {
              showNotification({
                type: "warning",
                title: "Upgrade Your Plan",
                message: `You've used ${result.currentUsage || 0}/${
                  result.limit || 0
                } conversions. Upgrade for unlimited conversions!`,
                duration: 10000,
              });
            }, 1000);
          } else {
            // Show other detailed errors
            showNotification({
              type: "error",
              title: errorTitle,
              message: errorMessage,
              duration: 8000,
            });
          }

          throw new Error(errorMessage);
        }

        // If we reach here, conversion was successful via JSON response
        setConversionResult(result);

        // Handle download URL if provided
        if (result.downloadUrl) {
          try {
            const downloadResponse = await fetch(
              `${API_URL}${result.downloadUrl}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (!downloadResponse.ok) {
              throw new Error("Failed to fetch converted file");
            }

            const blob = await downloadResponse.blob();
            const url = window.URL.createObjectURL(blob);
            setDownloadUrl(url);

            // Save to My Files
            if (blob) {
              try {
                await saveToMyFiles(
                  blob,
                  result.convertedFilename || "converted-file",
                  selectedTool.id
                );
              } catch (saveError) {
                console.warn("Failed to save file:", saveError);
              }
            }
          } catch (downloadError) {
            console.error("Download error:", downloadError);
          }
        }

        // Show success notification
        showNotification({
          type: "success",
          title: result.title || "Conversion Successful!",
          message:
            result.message || `Your file has been converted successfully`,
          duration: 5000,
        });
      }
      // Handle direct file responses (PDF, images, etc.)
      else if (
        contentType &&
        (contentType.includes("application/pdf") ||
          contentType.includes("image/"))
      ) {
        if (!response.ok) {
          // Try to read error message from response
          const errorText = await response.text();
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = {
              error: errorText || `HTTP error! status: ${response.status}`,
            };
          }

          throw new Error(
            errorData.error ||
              errorData.message ||
              `Conversion failed with status: ${response.status}`
          );
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        setDownloadUrl(url);

        // Get filename from Content-Disposition header
        let filename = "converted-file";
        const contentDisposition = response.headers.get("content-disposition");
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        }

        // Create success result
        const successResult = {
          success: true,
          convertedFilename: filename,
          downloadUrl: url,
        };

        setConversionResult(successResult);

        // Save to My Files
        if (blob) {
          try {
            await saveToMyFiles(blob, filename, selectedTool.id);
          } catch (saveError) {
            console.warn("Failed to save file:", saveError);
          }
        }

        // Show success notification
        showNotification({
          type: "success",
          title: "Conversion Successful!",
          message: `Your file has been converted to ${
            selectedTool.name.includes("to PDF")
              ? "PDF"
              : selectedTool.name.replace("PDF to ", "")
          }`,
          duration: 5000,
        });
      }
      // Handle other response types
      else {
        const responseText = await response.text();
        let errorData;

        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = {
            error: responseText || `Unexpected response type: ${contentType}`,
          };
        }

        if (!response.ok) {
          throw new Error(
            errorData.error ||
              errorData.message ||
              `HTTP error! status: ${response.status}`
          );
        }

        // If we get here with a successful but unexpected response, show generic success
        setConversionResult({
          success: true,
          convertedFilename: "converted-file",
        });

        showNotification({
          type: "success",
          title: "Conversion Completed",
          message: "Your file has been processed successfully",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Conversion error:", error);

      // Show detailed error notification
      let errorTitle = "Conversion Failed";
      let errorMessage = error.message;

      // Handle specific error types with better messages
      if (
        error.message.includes("Usage limit exceeded") ||
        error.message.includes("limit reached")
      ) {
        errorTitle = "Usage Limit Reached";
        errorMessage =
          "You have reached your monthly conversion limit. Please upgrade your plan or wait until next month.";
      } else if (error.message.includes("File too large")) {
        errorTitle = "File Too Large";
      } else if (error.message.includes("Invalid file type")) {
        errorTitle = "Invalid File Type";
      } else if (
        error.message.includes("network") ||
        error.message.includes("Network")
      ) {
        errorTitle = "Network Error";
        errorMessage = "Please check your internet connection and try again.";
      } else if (
        error.message.includes("401") ||
        error.message.includes("unauthorized")
      ) {
        errorTitle = "Authentication Error";
        errorMessage = "Your session has expired. Please log in again.";
        localStorage.removeItem("token");
      }

      showNotification({
        type: "error",
        title: errorTitle,
        message: errorMessage,
        duration: 8000,
      });
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

      showNotification({
        type: "success",
        title: "Download Started",
        message: `Downloading ${
          conversionResult.convertedFilename || "converted file"
        }`,
        duration: 3000,
      });
    } catch (error) {
      showNotification({
        type: "error",
        title: "Download Failed",
        message: error.message,
        duration: 5000,
      });
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

    showNotification({
      type: "info",
      title: "Reset",
      message: "Ready to convert another file",
      duration: 3000,
    });
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

  const metaPropsData = {
    title:
      "Free PDF Converter Tools | Convert Word, Excel, Images to PDF - PDF Works",
    description:
      "100% free PDF converter tools. Convert Word to PDF, Excel to PDF, PowerPoint to PDF, images to PDF, and PDF to images. No registration, no watermarks, completely free online conversion.",
    keyword:
      "free pdf converter, convert to pdf free, word to pdf free, excel to pdf free, image to pdf free, pdf to image free, free online converter, free document converter, free file converter, no cost pdf conversion, free pdf tools, completely free converter, free word to pdf online, free excel to pdf online, free image to pdf online",
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

export default ConvertTools;
