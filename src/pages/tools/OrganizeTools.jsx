// src/pages/tools/OrganizeTools.jsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Merge,
  Split,
  RotateCw,
  Upload,
  Download,
  ChevronDown,
  Eye,
  EyeOff,
  AlertTriangle,
} from "lucide-react";
import { useNotification } from "@/contexts/NotificationContext";
import Metatags from "../../SEO/metatags";

const API_URL = import.meta.env.VITE_API_URL;

const tools = [
  {
    id: "merge",
    name: "Merge PDFs",
    description: "Combine multiple PDFs into one",
    icon: Merge,
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "split",
    name: "Split PDF",
    description: "Extract pages or split by range",
    icon: Split,
    color: "from-purple-500 to-pink-500",
  },
  {
    id: "rotate",
    name: "Rotate Pages",
    description: "Rotate and reorder PDF pages",
    icon: RotateCw,
    color: "from-yellow-500 to-orange-500",
  },
];

const OrganizeTools = () => {
  const [selectedTool, setSelectedTool] = useState(null);
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [error, setError] = useState(null);
  const [splitRange, setSplitRange] = useState("");
  const [rotationSide, setRotationSide] = useState("90");
  const [showPreview, setShowPreview] = useState(false);
  const [fileSaved, setFileSaved] = useState(false);
  const [organizeId, setOrganizeId] = useState("");
  
  const { showNotification } = useNotification();

  // Get token from localStorage
  const getToken = () => {
    return localStorage.getItem("token");
  };

  const handleToolClick = (tool) => {
    setSelectedTool(tool);
    setFiles([]);
    setDownloadUrl(null);
    setError(null);
    setSplitRange("");
    setRotationSide("90");
    setShowPreview(false);
    setFileSaved(false);
    setOrganizeId("");
  };

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleSplitRangeChange = (e) => {
    setSplitRange(e.target.value);
  };

  const handleRotationChange = (e) => {
    setRotationSide(e.target.value);
  };

  const handleProcessPDF = async () => {
    if (selectedTool.id === "split" && !splitRange) {
      setError("Please enter the pages to split.");
      return;
    }
    if (selectedTool.id === "rotate" && !rotationSide) {
      setError("Please select a rotation side.");
      return;
    }

    setProcessing(true);
    setError(null);
    setFileSaved(false);
    setOrganizeId("");

    const formData = new FormData();
    
    // Add files to form data
    files.forEach((file) => {
      formData.append("files", file);
    });

    const queryParams = new URLSearchParams();
    if (selectedTool.id === "split" && splitRange) {
      queryParams.append("pages", splitRange);
    }
    if (selectedTool.id === "rotate" && rotationSide) {
      queryParams.append("side", rotationSide);
    }

    try {
      const token = getToken();
      if (!token) {
        setError("Please log in to process files");
        return;
      }

      const response = await fetch(
        `${API_URL}/api/tools/organize/${selectedTool.id}?${queryParams.toString()}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      // Check content type to determine if it's PDF or JSON error
      const contentType = response.headers.get('content-type');
      
      // Handle JSON responses (errors or limit exceeded)
      if (contentType && contentType.includes('application/json')) {
        const result = await response.json();
        
        // Check for limit exceeded error
        if (result.type === 'limit_exceeded') {
          showNotification({
            type: 'error',
            title: result.title || 'Usage Limit Reached',
            message: result.message || result.reason || 'Organize tools limit reached',
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
          
          setProcessing(false);
          return;
        }
        
        // Handle other JSON errors
        if (!response.ok || !result.success) {
          throw new Error(result.error || result.message || `Server error: ${response.status}`);
        }
      }

      // Check if response is successful for PDF
      if (!response.ok) {
        // For error responses, try to read as JSON first
        try {
          const errorData = await response.json();
          throw new Error(errorData.error || `Server error: ${response.status}`);
        } catch (jsonError) {
          // If not JSON, use text error
          const errorText = await response.text();
          throw new Error(errorText || `Failed to process PDF: ${response.status}`);
        }
      }

      // Success - it's a PDF file
      const organizeId = response.headers.get('X-Organize-Id');
      const fileSaved = response.headers.get('X-File-Saved');

      if (organizeId && fileSaved === "true") {
        setFileSaved(true);
        setOrganizeId(organizeId);
      }

      // Get the PDF blob from response
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setDownloadUrl(url);
      
      // Show success notification
      showNotification({
        type: 'success',
        title: 'PDF Processed Successfully',
        message: `${selectedTool.name} completed successfully!`,
        duration: 5000
      });

      console.log("✅ File processed successfully. Organize ID:", organizeId);

    } catch (err) {
      console.error("Processing error:", err);
      
      // Don't show duplicate notifications for limit exceeded
      if (!err.message.includes('Usage Limit Reached') && !err.message.includes('limit_exceeded')) {
        setError(err.message || "Failed to process PDF. Please try again.");
        showNotification({
          type: 'error',
          title: 'Processing Failed',
          message: err.message || "Failed to process PDF. Please try again.",
          duration: 5000
        });
      }
    } finally {
      setProcessing(false);
    }
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

        {downloadUrl ? (
          <div className="text-center mt-8">
            <h3 className="text-lg font-bold mb-4">Your PDF is ready! 🎉</h3>

            {/* File Saved Status */}
            {fileSaved && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700 text-sm font-medium">
                  ✅ File automatically saved to <strong>Organize History</strong>
                </p>
                {organizeId && (
                  <p className="text-green-600 text-xs mt-1">
                    Organize ID: {organizeId}
                  </p>
                )}
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

            {/* PDF Preview */}
            {showPreview && (
              <div className="mb-6 p-4 border border-gray-300 rounded-lg bg-white">
                <h4 className="text-sm font-semibold mb-3 text-center">
                  PDF Preview
                </h4>
                <div className="flex justify-center">
                  <iframe
                    src={downloadUrl}
                    className="w-full h-96 max-w-2xl border border-gray-200 rounded"
                    title="PDF Preview"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Note: Preview may not work in all browsers. Download to view the full document.
                </p>
              </div>
            )}

            {/* Download Button */}
            <a
              href={downloadUrl}
              download={`${selectedTool.id}-output.pdf`}
              className="inline-flex items-center justify-center px-6 py-3 rounded-full text-white bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 transition-all font-semibold mb-4"
            >
              <Download className="h-5 w-5 mr-2" />
              Download PDF
            </a>

            {/* Start Over Button */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setSelectedTool(null);
                  setDownloadUrl(null);
                  setFiles([]);
                  setSplitRange("");
                  setRotationSide("90");
                  setShowPreview(false);
                  setFileSaved(false);
                  setOrganizeId("");
                }}
                className="px-6 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
              >
                Start over
              </button>
            </div>
          </div>
        ) : (
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
                {selectedTool.id === "merge"
                  ? "PDF files (2-10 files)"
                  : "A single PDF file"}
              </p>
            </label>
            <input
              id="file-upload"
              type="file"
              multiple={selectedTool.id === "merge"}
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf"
            />

            {files.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-semibold mb-2">Selected Files ({files.length}):</p>
                <ul className="list-disc pl-5 space-y-1">
                  {files.map((file, index) => (
                    <li key={index} className="text-sm text-muted-foreground">
                      {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selectedTool.id === "split" && (
              <div className="mt-4">
                <label
                  className="block text-sm font-semibold mb-2"
                  htmlFor="page-range"
                >
                  Pages to split (e.g., 1,3-5)
                </label>
                <input
                  type="text"
                  id="page-range"
                  value={splitRange}
                  onChange={handleSplitRangeChange}
                  className="w-full px-4 py-2 rounded-md border border-gray-300 text-gray-900 bg-white"
                  placeholder="e.g., 1, 3-5, 7"
                />
              </div>
            )}

            {selectedTool.id === "rotate" && (
              <div className="mt-4">
                <label
                  className="block text-sm font-semibold mb-2"
                  htmlFor="rotation-side"
                >
                  Rotation direction
                </label>
                <div className="relative">
                  <select
                    id="rotation-side"
                    value={rotationSide}
                    onChange={handleRotationChange}
                    className="w-full appearance-none px-4 py-2 rounded-md border border-gray-300 text-gray-900 bg-white"
                  >
                    <option value="90">Rotate Right (90°)</option>
                    <option value="-90">Rotate Left (-90°)</option>
                    <option value="180">Rotate 180°</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={handleProcessPDF}
              disabled={
                files.length === 0 ||
                processing ||
                (selectedTool.id === "split" && !splitRange) ||
                (selectedTool.id === "rotate" && !rotationSide) ||
                (selectedTool.id === "merge" && files.length < 2)
              }
              className={`w-full mt-6 px-6 py-3 rounded-full font-bold text-white transition-all ${
                files.length === 0 ||
                processing ||
                (selectedTool.id === "split" && !splitRange) ||
                (selectedTool.id === "rotate" && !rotationSide) ||
                (selectedTool.id === "merge" && files.length < 2)
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
              }`}
            >
              {processing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Processing...
                </>
              ) : (
                `Process ${selectedTool.name}`
              )}
            </button>

            <button
              onClick={() => setSelectedTool(null)}
              className="w-full mt-4 px-6 py-2 text-sm text-muted-foreground hover:bg-gray-100 rounded-full transition-colors"
            >
              Back to tools
            </button>
          </div>
        )}
      </motion.div>
    );
  }

  const metaPropsData = {
    title:
      "Free PDF Organization Tools | Merge, Split, Rotate PDFs - PDF Works",
    description:
      "100% free PDF organization tools. Merge multiple PDFs into one, split PDF by pages or range, rotate PDF pages. No registration required, completely free PDF organization utilities with no watermarks.",
    keyword:
      "free pdf organizer, merge pdf free, split pdf free, rotate pdf free, free pdf merger, free pdf splitter, free pdf rotator, combine pdf free, extract pdf pages free, free pdf tools, no cost pdf organization, free online pdf organizer, completely free pdf tools, free document organizer, free pdf page management",
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

export default OrganizeTools;