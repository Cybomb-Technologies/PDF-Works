import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  RefreshCw,
  FileText,
  Zap,
  Download,
  FileCheck,
  Eye,
  Filter,
  MoreHorizontal,
  Search,
  X,
  Scan,
} from "lucide-react"; // ADD Scan ICON
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const API_URL = import.meta.env.VITE_API_URL;

const RecentActivity = ({ recentActivities, fetchUserData, formatDate }) => {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTool, setSelectedTool] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [previewFile, setPreviewFile] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // Tool categories and their icons - ADD OCR
  const toolCategories = [
    {
      id: "all",
      name: "All Activities",
      icon: FileText,
      color: "bg-purple-100 text-purple-600",
    },
    {
      id: "edit",
      name: "Edit Tools",
      icon: FileText,
      color: "bg-blue-100 text-blue-600",
    },
    {
      id: "organize",
      name: "Organize Tools",
      icon: FileText,
      color: "bg-emerald-100 text-emerald-600",
    },
    {
      id: "security",
      name: "Security Tools",
      icon: FileCheck,
      color: "bg-red-100 text-red-600",
    },
    {
      id: "optimize",
      name: "Optimize Tools",
      icon: Zap,
      color: "bg-pink-100 text-pink-600",
    },
    {
      id: "advanced",
      name: "Advanced Tools",
      icon: FileText,
      color: "bg-indigo-100 text-indigo-600",
    },
    {
      id: "convert",
      name: "Conversions",
      icon: Zap,
      color: "bg-cyan-100 text-cyan-600",
    },
    {
      id: "ocr",
      name: "OCR Tools", // ADD OCR CATEGORY
      icon: Scan,
      color: "bg-amber-100 text-amber-600",
    },
  ];

  // Fetch activities automatically when component mounts
  useEffect(() => {
    fetchRecentActivities();
  }, []);

  // Also update when parent provides new activities
  useEffect(() => {
    if (recentActivities && recentActivities.length > 0) {
      setActivities(recentActivities.slice(0, 5));
    }
  }, [recentActivities]);

  const fetchRecentActivities = async () => {
    try {
      setLoading(true);
      const token = getToken();

      if (!token) {
        return;
      }

      // Try the unified activities endpoint
      let activitiesData = [];

      try {
        const response = await fetch(`${API_URL}/api/activities?limit=5`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          activitiesData = data.activities || [];
          // console.log("Fetched activities:", activitiesData);
        }
      } catch (error) {
        console.log("Activities endpoint error:", error);
      }

      setActivities(activitiesData);
    } catch (error) {
      console.error("Error fetching recent activities:", error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const getToolType = (toolType, activity) => {
    const toolMap = {
      edit: "edit",
      organize: "organize",
      security: "security",
      optimize: "optimize",
      advanced: "advanced",
      convert: "conversion",
      ocr: "ocr", // ADD OCR MAPPING
    };
    return toolMap[toolType] || "other";
  };

  const getActivityIcon = (tool) => {
    const category = toolCategories.find((cat) => cat.id === tool);
    return category ? category.icon : FileText;
  };

  const getActivityColor = (tool) => {
    const category = toolCategories.find((cat) => cat.id === tool);
    return category ? category.color : "bg-gray-100 text-gray-600";
  };

  const getActivityTypeName = (tool, type) => {
    const typeMap = {
      conversion: {
        "pdf-to-word": "PDF to Word",
        "pdf-to-excel": "PDF to Excel",
        "pdf-to-ppt": "PDF to PPT",
        "pdf-to-image": "PDF to Image",
        "image-to-pdf": "Image to PDF",
        "word-to-pdf": "Word to PDF",
        "excel-to-pdf": "Excel to PDF",
        "ppt-to-pdf": "PPT to PDF",
      },
      edit: {
        "pdf-edit": "PDF Edit",
        "image-crop": "Image Crop",
        "file-rename": "File Rename",
        "e-signature": "E-Signature",
      },
      organize: {
        merge: "PDF Merge",
        split: "PDF Split",
        rotate: "PDF Rotate",
      },
      security: {
        encryption: "Encryption",
        decryption: "Decryption",
        "2fa-protection": "2FA Protection",
        "file-sharing": "File Sharing",
      },
      optimize: {
        "image-optimization": "Image Optimization",
        "code-minification": "Code Minify",
        "cache-cleaning": "Cache Clean",
      },
      advanced: {
        "automation-run": "Automation",
        "api-call": "API Connect",
        "analytics-view": "Analytics",
      },
      ocr: {
        "text-extraction": "OCR Text Extraction", // ADD OCR TYPE
      },
    };

    return typeMap[tool]?.[type] || type || "Activity";
  };

  const handlePreview = async (activity) => {
    if (!activity.downloadUrl) {
      console.log("No preview available for this file");
      return;
    }

    try {
      const token = getToken();
      const response = await fetch(`${API_URL}${activity.downloadUrl}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const blob = await response.blob();
        const fileUrl = URL.createObjectURL(blob);
        setPreviewFile({
          url: fileUrl,
          name: activity.fileName,
          type: getFileType(activity.fileName),
        });
        setShowPreview(true);
      }
    } catch (error) {
      console.error("Error previewing file:", error);
    }
  };

  const handleDownload = async (activity) => {
    if (!activity.downloadUrl) {
      console.log("No download available for this file");
      return;
    }

    try {
      const token = getToken();
      
      // For OCR files, we need to use the unified activities download endpoint
      let downloadUrl;
      if (activity.tool === 'ocr') {
        const filename = activity.downloadUrl.split("/").pop();
        downloadUrl = `${API_URL}/api/activities/download/ocr/${filename}`;
      } else {
        downloadUrl = `${API_URL}${activity.downloadUrl}`;
      }

      const response = await fetch(downloadUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = activity.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };

  const getFileType = (fileName) => {
    const ext = fileName.split(".").pop().toLowerCase();
    if (["pdf"].includes(ext)) return "pdf";
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "image";
    if (["doc", "docx"].includes(ext)) return "document";
    if (["xls", "xlsx"].includes(ext)) return "spreadsheet";
    if (["ppt", "pptx"].includes(ext)) return "presentation";
    if (["txt"].includes(ext)) return "text"; // ADD TEXT TYPE FOR OCR
    return "file";
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "N/A";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes === 0) return "0 Bytes";
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  const filteredActivities = activities.filter((activity) => {
    const matchesTool =
      selectedTool === "all" || activity.tool === selectedTool;
    const matchesSearch =
      activity.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.type.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTool && matchesSearch;
  });

  const refreshData = async () => {
    await fetchRecentActivities();
    if (fetchUserData) {
      fetchUserData();
    }
  };

  const viewAllActivities = () => {
    navigate("/activities", {
      state: {
        filter: selectedTool !== "all" ? selectedTool : null,
        search: searchTerm || null,
      },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4 }}
      className="glass-effect rounded-2xl p-6 xl:col-span-2"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Clock className="h-5 w-5 text-purple-600" />
          Recent Activity
          {loading && (
            <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
          )}
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Activities List */}
      {loading ? (
        <div className="text-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Loading recent activities...</p>
        </div>
      ) : filteredActivities.length > 0 ? (
        <div className="space-y-4">
          {filteredActivities.map((activity, index) => {
            const Icon = getActivityIcon(activity.tool);
            const colorClass = getActivityColor(activity.tool);

            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4 p-4 rounded-xl hover:bg-purple-50 transition-colors border group"
              >
                <div
                  className={`w-12 h-12 rounded-full ${colorClass} flex items-center justify-center`}
                >
                  <Icon className="h-6 w-6" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {activity.fileName}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}
                    >
                      {getActivityTypeName(activity.tool, activity.type)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatFileSize(activity.fileSize)}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        activity.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : activity.status === "processing"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {activity.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {activity.date
                      ? new Date(activity.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Unknown date"}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handlePreview(activity)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Preview"
                    disabled={!activity.downloadUrl}
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDownload(activity)}
                    className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                    title="Download"
                    disabled={!activity.downloadUrl}
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No recent activities found</p>
          <p className="text-sm text-gray-400 mt-1">
            {searchTerm || selectedTool !== "all"
              ? "Try changing your filters or search term"
              : "Your file processing activities will appear here"}
          </p>
        </div>
      )}

      {/* View All Button */}
      {activities.length > 0 && (
        <div className="mt-6 pt-4 border-t">
          <Button
            variant="outline"
            className="w-full"
            onClick={viewAllActivities}
          >
            <MoreHorizontal className="h-4 w-4 mr-2" />
            View All Activities
          </Button>
        </div>
      )}

      {/* File Preview Modal */}
      {showPreview && previewFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">{previewFile.name}</h3>
              <button
                onClick={() => {
                  setShowPreview(false);
                  setPreviewFile(null);
                  URL.revokeObjectURL(previewFile.url);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 max-h-[70vh] overflow-auto">
              {previewFile.type === "pdf" ? (
                <iframe
                  src={previewFile.url}
                  className="w-full h-96 border rounded-lg"
                  title="PDF Preview"
                />
              ) : previewFile.type === "image" ? (
                <img
                  src={previewFile.url}
                  alt="Preview"
                  className="max-w-full max-h-96 mx-auto rounded-lg"
                />
              ) : previewFile.type === "text" ? (
                <pre className="bg-gray-100 p-4 rounded-lg max-h-96 overflow-auto">
                  {previewFile.content || "Preview content not available"}
                </pre>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    Preview not available for this file type
                  </p>
                  <Button
                    onClick={() =>
                      handleDownload({
                        downloadUrl: previewFile.url,
                        fileName: previewFile.name,
                      })
                    }
                    className="mt-4"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download File
                  </Button>
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-gray-50 flex justify-end">
              <Button
                onClick={() =>
                  handleDownload({
                    downloadUrl: previewFile.url,
                    fileName: previewFile.name,
                  })
                }
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default RecentActivity;