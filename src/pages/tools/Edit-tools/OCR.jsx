import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Download,
  Upload,
  FileText,
  Eye,
  EyeOff,
  RotateCcw,
  Copy,
  Scan,
} from "lucide-react";
import Metatags from "../../../SEO/metatags";
import { useNotification } from "@/contexts/NotificationContext";

const API_URL = import.meta.env.VITE_API_URL;

const OCR = () => {
  const [image, setImage] = useState(null);
  const [extractedText, setExtractedText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [fileSaved, setFileSaved] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const fileInputRef = useRef(null);
  const textAreaRef = useRef(null);

  const { showNotification } = useNotification();

  // Get token from localStorage
  const getToken = () => {
    return localStorage.getItem("token");
  };

  // Save to Edit model function
  const saveToEditModel = async (
    textContent,
    filename,
    editType,
    originalName,
    metadata = {}
  ) => {
    try {
      const token = getToken();
      if (!token) {
        if (showNotification) {
          showNotification({
            type: "error",
            title: "Authentication Required",
            message: "Please log in to save files",
            duration: 5000,
          });
        }
        return { success: false, error: "Please log in to save files" };
      }

      // Convert text to blob
      const textBlob = new Blob([textContent], { type: "text/plain" });

      const formData = new FormData();
      formData.append("file", textBlob, filename);
      formData.append("originalName", originalName);
      formData.append("extractedText", textContent);

      if (metadata) {
        Object.keys(metadata).forEach((key) => {
          formData.append(
            key,
            typeof metadata[key] === "object"
              ? JSON.stringify(metadata[key])
              : metadata[key]
          );
        });
      }

      const response = await fetch(`${API_URL}/api/tools/pdf-editor/save-ocr`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      // First parse the response
      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        console.error("Failed to parse response:", parseError);
        throw new Error("Invalid server response");
      }

      // Handle limit exceeded response
      if (result.type === "limit_exceeded") {
        return {
          success: false,
          type: "limit_exceeded",
          title: result.title,
          message: result.message || result.reason,
          currentUsage: result.currentUsage,
          limit: result.limit,
          upgradeRequired: result.upgradeRequired,
        };
      }

      if (!response.ok) {
        throw new Error(result.error || `Failed to save: ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error("Save to Edit model error:", error);
      return { success: false, error: error.message };
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check if user is logged in
      const token = getToken();
      if (!token) {
        setError("Authentication Required - Please log in to use OCR");
        if (showNotification) {
          showNotification({
            type: "error",
            title: "Authentication Required",
            message: "Please log in to extract text from images",
            duration: 5000,
          });
        }
        // Clear the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      if (!file.type.startsWith("image/")) {
        setError("Please upload a valid image file (PNG, JPG, WebP)");
        if (showNotification) {
          showNotification({
            type: "error",
            title: "Invalid File Type",
            message: "Please upload a valid image file",
            duration: 5000,
          });
        }
        return;
      }

      setError("");
      setUploadedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target.result);
        setExtractedText("");
        setShowPreview(false);
        setFileSaved(false);

        if (showNotification) {
          showNotification({
            type: "success",
            title: "Image Selected",
            message: `${file.name} ready for text extraction`,
            duration: 3000,
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const extractText = async () => {
    // Check authentication before processing
    const token = getToken();
    if (!token) {
      setError("Authentication Required - Please log in to use OCR");
      if (showNotification) {
        showNotification({
          type: "error",
          title: "Authentication Required",
          message: "Please log in to extract text from images",
          duration: 5000,
        });
      }
      return;
    }

    if (!image) {
      setError("Please upload an image first");
      if (showNotification) {
        showNotification({
          type: "error",
          title: "No Image",
          message: "Please upload an image first",
          duration: 5000,
        });
      }
      return;
    }

    setIsProcessing(true);
    setError("");

    if (showNotification) {
      showNotification({
        type: "info",
        title: "Processing Image",
        message: "Extracting text from image...",
        duration: 0,
        autoClose: false,
      });
    }

    try {
      // Convert base64 image to blob
      const response = await fetch(image);
      const blob = await response.blob();

      const formData = new FormData();
      formData.append("image", blob, uploadedFile?.name || "image.png");

      const ocrResponse = await fetch(`${API_URL}/api/tools/ocr/extract-text`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!ocrResponse.ok) {
        const errorData = await ocrResponse.json();
        throw new Error(errorData.error || "Failed to extract text");
      }

      const result = await ocrResponse.json();

      if (result.success) {
        setExtractedText(result.text);

        // Save to Edit model if user is logged in
        if (token && result.text.trim()) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
          const filename = `extracted-text-${timestamp}.txt`;

          const saveResult = await saveToEditModel(
            result.text,
            filename,
            "ocr-text",
            uploadedFile?.name || "image.png",
            {
              textLength: result.text.length,
              confidence: result.confidence,
            }
          );

          if (!saveResult.success && saveResult.type === "limit_exceeded") {
            setError(saveResult.message || "Edit tools limit reached");
            if (showNotification) {
              showNotification({
                type: "error",
                title: saveResult.title || "Usage Limit Reached",
                message: saveResult.message || saveResult.reason,
                duration: 8000,
                currentUsage: saveResult.currentUsage,
                limit: saveResult.limit,
                upgradeRequired: saveResult.upgradeRequired,
                action: saveResult.upgradeRequired
                  ? {
                      label: "Upgrade Plan",
                      onClick: () => window.open("/pricing", "_blank"),
                      external: true,
                    }
                  : null,
              });
            }
          } else if (saveResult.success) {
            setFileSaved(true);
          }
        }

        if (showNotification) {
          showNotification({
            type: "success",
            title: "Text Extracted Successfully! 🎉",
            message: `Found ${result.text.length} characters of text`,
            duration: 5000,
          });
        }
      } else {
        throw new Error(result.error || "Failed to extract text");
      }
    } catch (err) {
      console.error("Error extracting text:", err);
      setError("Error extracting text: " + err.message);

      if (showNotification) {
        showNotification({
          type: "error",
          title: "Extraction Error",
          message: "Error extracting text: " + err.message,
          duration: 5000,
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = async () => {
    if (!extractedText) return;

    try {
      await navigator.clipboard.writeText(extractedText);
      if (showNotification) {
        showNotification({
          type: "success",
          title: "Copied!",
          message: "Text copied to clipboard",
          duration: 3000,
        });
      }
    } catch (err) {
      // Fallback for older browsers
      textAreaRef.current.select();
      document.execCommand("copy");
      if (showNotification) {
        showNotification({
          type: "success",
          title: "Copied!",
          message: "Text copied to clipboard",
          duration: 3000,
        });
      }
    }
  };

  const downloadText = () => {
    if (!extractedText) return;

    const blob = new Blob([extractedText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `extracted-text-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (showNotification) {
      showNotification({
        type: "success",
        title: "Download Started",
        message: "Downloading extracted text",
        duration: 3000,
      });
    }
  };

  const handleReset = () => {
    setImage(null);
    setExtractedText("");
    setError("");
    setShowPreview(false);
    setFileSaved(false);
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (showNotification) {
      showNotification({
        type: "info",
        title: "Reset",
        message: "Ready to extract text from another image",
        duration: 3000,
      });
    }
  };

  const metaPropsData = {
    title: "Free OCR Tool | Extract Text from Images Online - PDF Works",
    description:
      "100% free online OCR tool. Extract text from PNG, JPG, WebP images instantly. No registration required, accurate text recognition with support for multiple languages.",
    keyword:
      "free ocr, extract text from image, image to text free, free text recognition, free optical character recognition, free online ocr, free text extractor, no cost ocr, free image text reader, completely free ocr tool, free text scanner, free document digitization",
    image:
      "https://res.cloudinary.com/dcfjt8shw/image/upload/v1761288318/wn8m8g8skdpl6iz2rwoa.svg",
    url: "https://pdfworks.in/tools/",
  };

  const isLoggedIn = !!getToken();

  return (
    <>
      <Metatags metaProps={metaPropsData} />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-effect rounded-2xl p-8 max-w-4xl mx-auto"
      >
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mr-4">
            <Scan className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">OCR - Text Extractor</h2>
            <p className="text-sm text-muted-foreground">
              Upload an image to extract text using Optical Character
              Recognition
            </p>
            {!isLoggedIn && (
              <p className="text-xs text-red-500 mt-1">
                🔒 Authentication required to use this tool
              </p>
            )}
          </div>
        </div>

        {/* Authentication Warning for Non-Logged-in Users */}
        {!isLoggedIn && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Authentication Required
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Please log in to use the OCR tool and extract text from
                    images.
                  </p>
                </div>
                <div className="mt-3">
                  <button
                    onClick={() => (window.location.href = "/login")}
                    className="px-4 py-2 bg-yellow-500 text-white text-sm font-medium rounded-md hover:bg-yellow-600 transition-colors"
                  >
                    Log In Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {extractedText ? (
          <div className="text-center mt-8">
            <h3 className="text-lg font-bold mb-4">
              Text extracted successfully! 🎉
            </h3>

            {/* File Saved Status */}
            {fileSaved && isLoggedIn && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700 text-sm font-medium">
                  ✅ Text automatically saved to <strong>Edit History</strong>
                </p>
                <p className="text-green-600 text-xs mt-1">
                  {extractedText.length} characters extracted
                </p>
              </div>
            )}

            {/* Preview Toggle */}
            <div className="flex justify-center mb-4 gap-2">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                {showPreview ? (
                  <EyeOff className="h-4 w-4 mr-2" />
                ) : (
                  <Eye className="h-4 w-4 mr-2" />
                )}
                {showPreview ? "Hide Image" : "Show Image"}
              </button>
            </div>

            {/* Image Preview */}
            {showPreview && image && (
              <div className="mb-6 p-4 border border-gray-300 rounded-lg bg-white">
                <h4 className="text-sm font-semibold mb-3 text-center">
                  Original Image
                </h4>
                <div className="flex justify-center">
                  <img
                    src={image}
                    alt="Original for OCR"
                    className="max-w-full max-h-96 object-contain border border-gray-200 rounded"
                  />
                </div>
              </div>
            )}

            {/* Extracted Text */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-semibold">Extracted Text</h4>
                <div className="text-xs text-gray-500">
                  {extractedText.length} characters
                </div>
              </div>
              <div className="relative">
                <textarea
                  ref={textAreaRef}
                  value={extractedText}
                  onChange={(e) => setExtractedText(e.target.value)}
                  className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Extracted text will appear here..."
                />
                <button
                  onClick={copyToClipboard}
                  className="absolute top-2 right-2 p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                  title="Copy to clipboard"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={copyToClipboard}
                disabled={!extractedText}
                className="flex items-center gap-2 px-6 py-3 rounded-full font-bold text-white bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 transition-all"
              >
                <Copy className="h-4 w-4" />
                Copy Text
              </button>

              <button
                onClick={downloadText}
                disabled={!extractedText}
                className="flex items-center gap-2 px-6 py-3 rounded-full font-bold text-white bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 transition-all"
              >
                <Download className="h-4 w-4" />
                Download Text
              </button>

              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all"
              >
                <RotateCcw className="h-4 w-4" />
                New Image
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-8">
            {/* File Upload */}
            <label
              htmlFor="image-upload"
              className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer transition-colors mb-6 ${
                isLoggedIn
                  ? "border-gray-400 hover:border-orange-500"
                  : "border-red-300 bg-red-50 cursor-not-allowed"
              }`}
              onClick={(e) => {
                if (!isLoggedIn) {
                  e.preventDefault();
                  setError(
                    "Authentication Required - Please log in to use OCR"
                  );
                  if (showNotification) {
                    showNotification({
                      type: "error",
                      title: "Authentication Required",
                      message: "Please log in to extract text from images",
                      duration: 5000,
                    });
                  }
                }
              }}
            >
              <Upload
                className={`w-10 h-10 mb-2 ${
                  isLoggedIn ? "text-gray-400" : "text-red-400"
                }`}
              />
              <p
                className={`font-semibold text-sm ${
                  isLoggedIn ? "text-gray-700" : "text-red-700"
                }`}
              >
                {isLoggedIn
                  ? "Click to upload or drag and drop"
                  : "Please log in to upload images"}
              </p>
              <p
                className={`text-xs mt-1 ${
                  isLoggedIn ? "text-muted-foreground" : "text-red-600"
                }`}
              >
                {isLoggedIn
                  ? "PNG, JPG, WebP files with text"
                  : "Authentication required"}
              </p>
              <input
                id="image-upload"
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden"
                accept="image/*"
                disabled={!isLoggedIn}
              />
            </label>

            {error && (
              <p className="text-red-500 text-sm text-center mb-4">{error}</p>
            )}

            {image && isLoggedIn && (
              <>
                {/* Image Preview */}
                <div className="mb-6">
                  <h3 className="font-medium mb-2 text-sm">Image Preview</h3>
                  <div className="border border-gray-300 rounded-lg p-4 bg-white">
                    <img
                      src={image}
                      alt="Uploaded for OCR"
                      className="max-w-full max-h-64 object-contain mx-auto"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Ready for text extraction
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={extractText}
                    disabled={isProcessing}
                    className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-white transition-all ${
                      isProcessing
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Extracting...
                      </>
                    ) : (
                      <>
                        <Scan className="h-4 w-4" />
                        Extract Text
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
              </>
            )}
          </div>
        )}
      </motion.div>
    </>
  );
};

export default OCR;
