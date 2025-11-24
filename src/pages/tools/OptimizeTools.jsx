import React, { useState } from "react";
import { motion } from "framer-motion";
import { Gauge, Trash2, Code2, Copy, Check, Download, AlertTriangle } from "lucide-react";
import { useNotification } from "@/contexts/NotificationContext";
import Metatags from "../../SEO/metatags";

const API_URL = import.meta.env.VITE_API_URL;

// --- Tools List ---
const tools = [
  {
    id: "image-opt",
    name: "Image Optimizer",
    description: "Compress images without losing quality",
    icon: Gauge,
    color: "from-green-500 to-lime-500",
  },
  {
    id: "code-minify",
    name: "Code Minifier",
    description: "Minify JS, CSS, and HTML for faster loads",
    icon: Code2,
    color: "from-purple-500 to-pink-500",
  },
  {
    id: "cache-clean",
    name: "Cache Cleaner",
    description: "Clean and refresh system or browser cache",
    icon: Trash2,
    color: "from-blue-500 to-indigo-500",
  },
];

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Enhanced fetch with auth
const authFetch = async (url, options = {}) => {
  const token = getAuthToken();
  const headers = {
    ...options.headers,
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };

  return fetch(url, { ...options, headers });
};

// --- Modal: Image Optimizer ---
const ImageOptimizerModal = ({ isOpen, onClose }) => {
  const [file, setFile] = useState(null);
  const [compressedBlob, setCompressedBlob] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fileSaved, setFileSaved] = useState(false);
  const [optimizeId, setOptimizeId] = useState(null);
  
  const { showNotification } = useNotification();

  const handleImageOptimize = async () => {
    if (!file) return;
    setLoading(true);
    setFileSaved(false);
    setOptimizeId(null);
    
    try {
      const formData = new FormData();
      formData.append("files", file);
      formData.append("quality", "80");
      formData.append("maxWidth", "1920");
      formData.append("maxHeight", "1080");

      const response = await authFetch(`${API_URL}/api/tools/optimize/optimize-image`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      
      // Handle backend errors with detailed messages
      if (!response.ok || !result.success) {
        // Check for limit exceeded error
        if (result.type === 'limit_exceeded') {
          showNotification({
            type: 'error',
            title: result.title || 'Usage Limit Reached',
            message: result.message || result.reason || 'Optimize tools limit reached',
            duration: 8000,
            currentUsage: result.currentUsage,
            limit: result.limit,
            upgradeRequired: result.upgradeRequired,
            action: result.upgradeRequired ? {
              label: 'Upgrade Plan',
              onClick: () => window.location.href = '/billing',
              external: true
            } : undefined
          });
          
          return;
        } else {
          // Show other detailed errors
          showNotification({
            type: 'error',
            title: result.title || 'Operation Failed',
            message: result.message || result.error || 'Something went wrong',
            duration: 5000
          });
        }
        
        throw new Error(result.message || `HTTP error! status: ${response.status}`);
      }

      // Convert base64 back to blob
      const byteCharacters = atob(result.fileData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: result.mimeType });
      const url = window.URL.createObjectURL(blob);
      
      setCompressedBlob(url);

      // Set stats from the response
      const stats = result.stats;
      setStats({
        original: (stats.originalSize / 1024).toFixed(2),
        optimized: (stats.optimizedSize / 1024).toFixed(2),
        reduced: (stats.sizeReduction / 1024).toFixed(2),
        percent: stats.reductionPercent,
      });

      // Check if operation was saved
      if (result.optimizeId) {
        setFileSaved(true);
        setOptimizeId(result.optimizeId);
      }

      // Show success notification
      showNotification({
        type: 'success',
        title: 'Image Optimized',
        message: `Successfully reduced image size by ${stats.reductionPercent}%`,
        duration: 5000
      });

      console.log('Optimization successful:', stats);

    } catch (error) {
      console.error("❌ Image optimization failed:", error);
      // Don't show duplicate notifications for limit exceeded
      if (!error.message.includes('Usage Limit Reached') && !error.message.includes('limit_exceeded')) {
        showNotification({
          type: 'error',
          title: 'Optimization Failed',
          message: error.message,
          duration: 5000
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!compressedBlob) return;
    const link = document.createElement("a");
    link.href = compressedBlob;
    link.download = `optimized-${file.name}`;
    link.click();
  };

  const resetModal = () => {
    setFile(null);
    setCompressedBlob(null);
    setStats(null);
    setFileSaved(false);
    setOptimizeId(null);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-effect w-full max-w-lg p-6 rounded-2xl bg-gray-900 border border-gray-700 text-white"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-green-700">Image Optimizer</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white text-lg"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* File Saved Status */}
          {fileSaved && (
            <div className="p-3 bg-green-900 border border-green-700 rounded-lg">
              <p className="text-green-400 text-sm font-medium">
                ✅ File saved to optimize history {optimizeId && `(ID: ${optimizeId})`}
              </p>
            </div>
          )}

          {/* File Input */}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const selectedFile = e.target.files[0];
              if (selectedFile) {
                setFile(selectedFile);
                setCompressedBlob(null);
                setStats(null);
                setFileSaved(false);
                setOptimizeId(null);
                console.log('File selected:', selectedFile.name, 'Size:', (selectedFile.size / 1024).toFixed(2) + 'KB');
              }
            }}
            className="w-full text-sm text-gray-300 border border-gray-600 rounded-lg px-3 py-2 cursor-pointer bg-gray-800"
          />

          {file && (
            <div className="text-sm text-gray-400">
              <p>Selected: {file.name}</p>
              <p>Size: {(file.size / 1024).toFixed(2)} KB</p>
            </div>
          )}

          <button
            onClick={handleImageOptimize}
            disabled={!file || loading}
            className="w-full bg-gradient-to-r from-green-500 to-lime-500 text-white font-medium py-2 rounded-lg hover:from-green-600 hover:to-lime-600 transition disabled:opacity-50"
          >
            {loading ? "Optimizing..." : "Optimize Image"}
          </button>

          {stats && (
            <div className="bg-gray-800 rounded-lg p-4 text-sm space-y-2">
              <p>
                <strong>Original Size:</strong> {stats.original} KB
              </p>
              <p>
                <strong>Optimized Size:</strong> {stats.optimized} KB
              </p>
              <p>
                <strong>Reduced:</strong> {stats.reduced} KB (
                <span className="text-green-400">{stats.percent}% smaller</span>
                )
              </p>
            </div>
          )}

          {compressedBlob && (
            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition"
            >
              <Download className="h-5 w-5" />
              Download Optimized Image
            </button>
          )}

          {/* Start Over Button */}
          {compressedBlob && (
            <button
              onClick={resetModal}
              className="w-full px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors border border-gray-600"
            >
              Optimize Another Image
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// --- Modal: Code Minifier ---
const CodeMinifierModal = ({ isOpen, onClose }) => {
  const [code, setCode] = useState("");
  const [type, setType] = useState("js");
  const [minifiedResult, setMinifiedResult] = useState("");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [operationSaved, setOperationSaved] = useState(false);
  const [optimizeId, setOptimizeId] = useState(null);
  
  const { showNotification } = useNotification();

  const handleMinify = async () => {
    if (!code.trim()) return;
    
    setLoading(true);
    setOperationSaved(false);
    setOptimizeId(null);
    
    try {
      const response = await authFetch(`${API_URL}/api/tools/optimize/minify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code,
          type: type
        }),
      });

      const result = await response.json();
      
      // Handle backend errors with detailed messages
      if (!response.ok || !result.success) {
        // Check for limit exceeded error
        if (result.type === 'limit_exceeded') {
          showNotification({
            type: 'error',
            title: result.title || 'Usage Limit Reached',
            message: result.message || result.reason || 'Optimize tools limit reached',
            duration: 8000,
            currentUsage: result.currentUsage,
            limit: result.limit,
            upgradeRequired: result.upgradeRequired,
            action: result.upgradeRequired ? {
              label: 'Upgrade Plan',
              onClick: () => window.location.href = '/billing',
              external: true
            } : undefined
          });
          
          return;
        } else {
          // Show other detailed errors
          showNotification({
            type: 'error',
            title: result.title || 'Operation Failed',
            message: result.message || result.error || 'Something went wrong',
            duration: 5000
          });
        }
        
        throw new Error(result.message || `HTTP error! status: ${response.status}`);
      }

      setMinifiedResult(result.minifiedCode);
      setStats(result.stats);
      
      if (result.optimizeId) {
        setOperationSaved(true);
        setOptimizeId(result.optimizeId);
      }

      // Show success notification
      showNotification({
        type: 'success',
        title: 'Code Minified',
        message: `Successfully reduced code by ${result.stats.reductionPercent}%`,
        duration: 5000
      });

    } catch (error) {
      console.error("❌ Code minification failed:", error);
      // Don't show duplicate notifications for limit exceeded
      if (!error.message.includes('Usage Limit Reached') && !error.message.includes('limit_exceeded')) {
        showNotification({
          type: 'error',
          title: 'Minification Failed',
          message: error.message,
          duration: 5000
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(minifiedResult);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleReset = () => {
    setCode("");
    setMinifiedResult("");
    setStats(null);
    setType("js");
    setOperationSaved(false);
    setOptimizeId(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-effect rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border border-gray-700 text-white"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-purple-700">Code Minifier</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Operation Saved Status */}
        {operationSaved && (
          <div className="mb-4 p-3 bg-purple-900 border border-purple-700 rounded-lg">
            <p className="text-purple-400 text-sm font-medium">
              ✅ Operation saved to optimize history {optimizeId && `(ID: ${optimizeId})`}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-purple-700">
                Select Code Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="js">JavaScript</option>
                <option value="css">CSS</option>
                <option value="html">HTML</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-purple-700">
                Paste Your Code
              </label>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={`Paste your ${type.toUpperCase()} code here...`}
                className="w-full h-64 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none font-mono text-sm"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleMinify}
                disabled={!code.trim() || loading}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 px-4 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-600 hover:to-pink-600 transition-all"
              >
                {loading ? "Minifying..." : "Minify Code"}
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 border border-purple-700 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Output Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-purple-700">
                Minified Output
              </label>
              {minifiedResult && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-3 py-1 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied ? "Copied!" : "Copy"}
                </button>
              )}
            </div>

            <div className="relative">
              <textarea
                readOnly
                value={minifiedResult}
                placeholder="Minified code will appear here..."
                className="w-full h-64 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none resize-none font-mono text-sm"
              />

              {minifiedResult && stats && (
                <div className="absolute top-2 right-2">
                  <span className="bg-green-500 text-xs px-2 py-1 rounded">
                    {stats.reductionPercent}% smaller
                  </span>
                </div>
              )}
            </div>

            {stats && (
              <div className="text-sm text-gray-400">
                <p>Original: {stats.originalLength} characters</p>
                <p>Minified: {stats.minifiedLength} characters</p>
                <p>Saved: {stats.charactersSaved} characters</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Cache Cleaner function (updated to use backend with usage limits)
const handleCacheClean = async (showNotification) => {
  try {
    const response = await authFetch(`${API_URL}/api/tools/optimize/clean-cache`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const result = await response.json();
    
    // Handle backend errors with detailed messages
    if (!response.ok || !result.success) {
      // Check for limit exceeded error
      if (result.type === 'limit_exceeded') {
        showNotification({
          type: 'error',
          title: result.title || 'Usage Limit Reached',
          message: result.message || result.reason || 'Optimize tools limit reached',
          duration: 8000,
          currentUsage: result.currentUsage,
          limit: result.limit,
          upgradeRequired: result.upgradeRequired,
          action: result.upgradeRequired ? {
            label: 'Upgrade Plan',
            onClick: () => window.location.href = '/billing',
            external: true
          } : undefined
        });
        
        return;
      } else {
        // Show other detailed errors
        showNotification({
          type: 'error',
          title: result.title || 'Operation Failed',
          message: result.message || result.error || 'Something went wrong',
          duration: 5000
        });
      }
      
      throw new Error(result.message || `HTTP error! status: ${response.status}`);
    }

    // Clear local storage and reload
    localStorage.clear();
    sessionStorage.clear();
    
    showNotification({
      type: 'success',
      title: 'Cache Cleaned',
      message: 'Cache cleared successfully! Page will reload.',
      duration: 3000
    });
    
    setTimeout(() => {
      window.location.reload();
    }, 2000);
    
  } catch (error) {
    console.error("❌ Cache cleaning failed:", error);
    // Don't show duplicate notifications for limit exceeded
    if (!error.message.includes('Usage Limit Reached') && !error.message.includes('limit_exceeded')) {
      showNotification({
        type: 'error',
        title: 'Cache Cleaning Failed',
        message: error.message,
        duration: 5000
      });
    }
  }
};

// --- Main Component ---
const OptimizeTools = () => {
  const [codeMinifierOpen, setCodeMinifierOpen] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  
  const { showNotification } = useNotification();

  const handleToolClick = (tool) => {
    if (tool.id === "image-opt") setImageModalOpen(true);
    if (tool.id === "code-minify") setCodeMinifierOpen(true);
    if (tool.id === "cache-clean") {
      if (
        confirm(
          "Are you sure you want to clear all cache? This will reload the page."
        )
      )
        handleCacheClean(showNotification);
    }
  };

  const metaPropsData = {
    title:
      "Free Optimization Tools | Image Compressor, Code Minifier, Cache Cleaner - PDF Works",
    description:
      "100% free optimization tools. Compress images without quality loss, minify JavaScript/CSS/HTML code, and clean browser cache. No registration required, completely free optimization utilities.",
    keyword:
      "free optimization tools, image compressor free, compress images online free, free code minifier, minify javascript free, minify css free, minify html free, free cache cleaner, clear browser cache free, free image optimizer, free file optimization, no cost optimization tools, free online compressor, free code optimization, free performance tools",
    image:
      "https://res.cloudinary.com/dcfjt8shw/image/upload/v1761288318/wn8m8g8skdpl6iz2rwoa.svg",
    url: "https://pdfworks.in/tools/",
  };

  return (
    <>
      <Metatags metaProps={metaPropsData} />
      <div className="w-full">
        {/* --- Responsive Grid Fixed --- */}
        <div className="grid gap-6 mt-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 w-full">
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
                className="glass-effect rounded-2xl p-6 cursor-pointer transition-all group flex flex-col h-full w-full sm:w-full md:w-full"
              >
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-4`}
                >
                  <Icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-lg font-bold mb-2">{tool.name}</h3>
                <p className="text-sm text-gray-400 flex-grow">
                  {tool.description}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Modals */}
        <ImageOptimizerModal
          isOpen={imageModalOpen}
          onClose={() => setImageModalOpen(false)}
        />
        <CodeMinifierModal
          isOpen={codeMinifierOpen}
          onClose={() => setCodeMinifierOpen(false)}
        />
      </div>
    </>
  );
};

export default OptimizeTools;