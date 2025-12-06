import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  Upload,
  Eye,
  EyeOff,
  RotateCcw,
  Copy,
  Scan,
  History,
  FileText,
  Image,
  Languages,
  ClipboardCheck,
  FileSearch,
  X,
} from "lucide-react";
import Metatags from "../../SEO/metatags";
import { useNotification } from "@/contexts/NotificationContext";

const API_URL = import.meta.env.VITE_API_URL;

// Define OCR tools array
const ocrTools = [
  {
    id: "image-ocr",
    name: "Image OCR",
    description: "Extract text from images (PNG, JPG, WebP)",
    icon: Scan,
    color: "from-orange-500 to-red-500",
    active: true,
  },
  {
    id: "pdf-ocr",
    name: "PDF OCR",
    description: "Extract text from PDF documents",
    icon: FileText,
    color: "from-purple-500 to-pink-500",
    active: false,
    comingSoon: true,
  },
  {
    id: "multi-language",
    name: "Multi-language OCR",
    description: "Support for 100+ languages",
    icon: Languages,
    color: "from-blue-500 to-cyan-500",
    active: false,
    comingSoon: true,
  },
  {
    id: "batch-ocr",
    name: "Batch OCR",
    description: "Process multiple images at once",
    icon: Image,
    color: "from-green-500 to-emerald-500",
    active: false,
    comingSoon: true,
  },
  {
    id: "handwriting",
    name: "Handwriting OCR",
    description: "Extract text from handwritten notes",
    icon: ClipboardCheck,
    color: "from-indigo-500 to-violet-500",
    active: false,
    comingSoon: true,
  },
  {
    id: "document-scan",
    name: "Document Scanner",
    description: "Scan and extract text from documents",
    icon: FileSearch,
    color: "from-amber-500 to-yellow-500",
    active: false,
    comingSoon: true,
  },
];

const OCR = () => {
  const [image, setImage] = useState(null);
  const [extractedText, setExtractedText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [fileSaved, setFileSaved] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [ocrId, setOcrId] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [ocrHistory, setOcrHistory] = useState([]);
  const [activeTool, setActiveTool] = useState("image-ocr"); // Default to Image OCR
  const [showToolModal, setShowToolModal] = useState(false);
  const fileInputRef = useRef(null);
  const textAreaRef = useRef(null);

  const { showNotification } = useNotification();

  // Get token from localStorage
  const getToken = () => {
    return localStorage.getItem("token");
  };

  // Fetch OCR history
  const fetchOCRHistory = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(`${API_URL}/api/tools/ocr/history`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setOcrHistory(result.ocrOps || []);
        }
      }
    } catch (error) {
      console.error("Failed to fetch OCR history:", error);
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
        setOcrId(null);

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

      const result = await ocrResponse.json();

      if (!ocrResponse.ok || !result.success) {
        // Handle plan restriction errors
        if (result.upgradeRequired) {
          setError(result.error);
          if (showNotification) {
            showNotification({
              type: "error",
              title: "Plan Upgrade Required",
              message: result.error,
              duration: 6000,
              action: {
                label: "View Plans",
                onClick: () => window.location.href = "/pricing"
              }
            });
          }
          return;
        }
        throw new Error(result.error || "Failed to extract text");
      }

      if (result.success) {
        setExtractedText(result.text);
        setOcrId(result.ocrId);

        // Show save status if saved to MongoDB
        if (result.ocrId) {
          setFileSaved(true);
        }

        if (showNotification) {
          showNotification({
            type: "success",
            title: "Text Extracted Successfully! 🎉",
            message: `Found ${result.text.length} characters of text${result.ocrId ? ' - Saved to OCR history' : ''}`,
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
    setOcrId(null);
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

  const toggleHistory = async () => {
    if (!showHistory) {
      await fetchOCRHistory();
    }
    setShowHistory(!showHistory);
  };

  const handleToolClick = (tool) => {
    if (tool.comingSoon) {
      alert(`${tool.name} is coming soon! 🚀`);
      return;
    }
    setActiveTool(tool.id);
    setShowToolModal(true);
  };

  const closeToolModal = () => {
    setShowToolModal(false);
  };

  const metaPropsData = {
    title: "Free OCR Tools | Extract Text from Images & PDFs - PDF Works",
    description:
      "100% free OCR tools. Extract text from images, PDF documents, handwritten notes, and multiple files instantly. No registration required.",
    keyword:
      "free ocr, extract text from image, image to text free, pdf ocr free, handwriting ocr, multi-language ocr, batch ocr, free text recognition, optical character recognition",
    image:
      "https://res.cloudinary.com/dcfjt8shw/image/upload/v1761288318/wn8m8g8skdpl6iz2rwoa.svg",
    url: "https://pdfworks.in/tools/ocr",
  };

  const isLoggedIn = !!getToken();

  // If we're in "tool grid" mode (showing multiple tools like OptimizeTools)
  return (
    <>
      <Metatags metaProps={metaPropsData} />
      <div className="w-full">
        <div className="space-y-8">
          {/* Header */}
          {/* <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-red-500 mb-4">
              <Scan className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">OCR Tools</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Extract text from images, PDFs, and documents using advanced Optical Character Recognition technology
            </p>
          </motion.div> */}

          {/* --- Tool Grid --- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
            {ocrTools.map((tool, i) => {
              const Icon = tool.icon;
              return (
                <motion.div
                  key={tool.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ scale: tool.comingSoon ? 1 : 1.05, y: tool.comingSoon ? 0 : -5 }}
                  onClick={() => handleToolClick(tool)}
                  className={`glass-effect rounded-2xl p-6 transition-all group flex flex-col h-full ${
                    tool.comingSoon ? 'opacity-80 cursor-default' : 'cursor-pointer hover:shadow-lg'
                  }`}
                >
                  <div
                    className={`w-14 h-14 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-4`}
                  >
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                    {tool.name}
                    {tool.comingSoon && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        Coming Soon
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-muted-foreground flex-grow">
                    {tool.description}
                  </p>
                  
                </motion.div>
              );
            })}
          </div>

          {/* Info Section */}
          {/* <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-2xl p-6 mt-8"
          >
            <h3 className="font-bold text-lg mb-2 text-orange-800">
              💡 How OCR Works
            </h3>
            <ul className="space-y-2 text-sm text-orange-700">
              <li>• Upload any image with text (PNG, JPG, WebP)</li>
              <li>• Our AI-powered OCR engine analyzes the image</li>
              <li>• Text is extracted with high accuracy</li>
              <li>• Copy, download, or save the extracted text</li>
              <li>• Works with multiple languages and fonts</li>
              <li>• No registration required - completely free!</li>
            </ul>
          </motion.div> */}
        </div>

        {/* --- Tool Modal (for Image OCR) --- */}
        <AnimatePresence>
          {showToolModal && activeTool === "image-ocr" && (
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-6 w-[95%] max-w-7xl h-[90vh] overflow-auto"
              >
                {/* Close Button */}
                <button
                  onClick={closeToolModal}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-800 z-10"
                >
                  <X className="h-5 w-5" />
                </button>

                {/* OCR Functionality (Your existing code) */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mr-4">
                      <Scan className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">OCR - Text Extractor</h2>
                      <p className="text-sm text-muted-foreground">
                        Upload an image to extract text using Optical Character Recognition
                      </p>
                      {!isLoggedIn && (
                        <p className="text-xs text-red-500 mt-1">
                          🔒 Authentication required to use this tool
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {isLoggedIn && (
                    <button
                      onClick={toggleHistory}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      <History className="h-4 w-4" />
                      History
                    </button>
                  )}
                </div>

                {/* OCR History Modal */}
                {showHistory && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="glass-effect rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto bg-gray-900 border border-gray-700 text-white"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold">OCR History</h3>
                        <button
                          onClick={toggleHistory}
                          className="text-gray-400 hover:text-white"
                        >
                          ✕
                        </button>
                      </div>
                      
                      {ocrHistory.length === 0 ? (
                        <p className="text-gray-400 text-center py-8">No OCR history found</p>
                      ) : (
                        <div className="space-y-3">
                          {ocrHistory.map((item) => (
                            <div key={item._id} className="p-3 bg-gray-800 rounded-lg">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">{item.originalFilename}</p>
                                  <p className="text-sm text-gray-400">
                                    {item.extractedTextLength} characters • {new Date(item.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <a
                                  href={`${API_URL}${item.downloadUrl}`}
                                  className="px-3 py-1 bg-orange-500 text-white text-sm rounded hover:bg-orange-600 transition-colors"
                                  download
                                >
                                  Download
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  </div>
                )}

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

                {/* Your existing OCR functionality */}
                {extractedText ? (
                  <div className="text-center mt-8">
                    <h3 className="text-lg font-bold mb-4">
                      Text extracted successfully! 🎉
                    </h3>

                    {/* File Saved Status */}
                    {fileSaved && isLoggedIn && (
                      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-green-700 text-sm font-medium">
                          ✅ Text automatically saved to <strong>OCR History</strong>
                        </p>
                        <p className="text-green-600 text-xs mt-1">
                          {extractedText.length} characters extracted • ID: {ocrId}
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default OCR;