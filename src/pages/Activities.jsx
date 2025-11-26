import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Filter,
  Search,
  X,
  Eye,
  Download,
  FileText,
  Zap,
  Download as DownloadIcon,
  FileCheck,
  Shield,
  Settings,
  RefreshCw,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const API_URL = import.meta.env.VITE_API_URL;

const Activities = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    tool: "all",
    status: "all",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const toolCategories = [
    {
      id: "all",
      name: "All Tools",
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
      icon: DownloadIcon,
      color: "bg-green-100 text-green-600",
    },
    {
      id: "security",
      name: "Security Tools",
      icon: Shield,
      color: "bg-orange-100 text-orange-600",
    },
    {
      id: "optimize",
      name: "Optimize Tools",
      icon: Settings,
      color: "bg-pink-100 text-pink-600",
    },
    {
      id: "advanced",
      name: "Advanced Tools",
      icon: FileCheck,
      color: "bg-indigo-100 text-indigo-600",
    },
    {
      id: "convert",
      name: "Conversions",
      icon: Zap,
      color: "bg-cyan-100 text-cyan-600",
    },
  ];

  const statusOptions = [
    { id: "all", name: "All Status" },
    { id: "completed", name: "Completed" },
    { id: "processing", name: "Processing" },
    { id: "failed", name: "Failed" },
  ];

  useEffect(() => {
    // Apply initial filters from navigation
    if (location.state) {
      setFilters((prev) => ({
        ...prev,
        ...location.state,
      }));
    }
    fetchActivities();
    fetchStats();
  }, [location]);

  // Single API call for all activities
  const fetchActivities = async () => {
    try {
      setLoading(true);
      const token = getToken();

      // console.log('🔄 Fetching activities from unified API...');

      const response = await fetch(`${API_URL}/api/activities?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        // console.log(`✅ Received ${data.activities?.length || 0} activities`);
        setActivities(data.activities || []);
      } else {
        console.error("❌ Failed to fetch activities");
        setActivities([]);
      }
    } catch (error) {
      console.error("❌ Error fetching activities:", error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch activity statistics
  const fetchStats = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/api/activities/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  // Enhanced preview handler
  const handlePreview = async (activity) => {
    console.group("🔄 File Preview");
    // console.log("Activity:", activity);

    if (!activity.downloadUrl) {
      console.error("❌ No download URL available");
      alert("This file cannot be previewed (no download URL available)");
      console.groupEnd();
      return;
    }

    try {
      const token = getToken();
      if (!token) {
        console.error("❌ No authentication token");
        alert("Please log in again");
        navigate("/login");
        return;
      }

      // Use the unified download endpoint
      const filename = activity.downloadUrl.split("/").pop();
      const fullUrl = `${API_URL}/api/activities/download/${activity.tool}/${filename}`;

      // console.log("📡 Requesting:", fullUrl);

      const response = await fetch(fullUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache",
        },
      });

      // console.log("📊 Response:", response.status, response.statusText);

      if (!response.ok) {
        let errorMessage = `Server error: ${response.status}`;

        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          console.error("❌ Server error details:", errorData);
        } catch (e) {
          const errorText = await response.text();
          console.error("❌ Server error text:", errorText);
        }

        alert(`Cannot preview file: ${errorMessage}`);
        console.groupEnd();
        return;
      }

      const blob = await response.blob();
      // console.log("📦 Received blob:", blob.size, "bytes, type:", blob.type);

      if (blob.size === 0) {
        alert("File is empty or corrupted");
        console.groupEnd();
        return;
      }

      const fileUrl = URL.createObjectURL(blob);
      // console.log("🔗 Created object URL");

      setPreviewFile({
        url: fileUrl,
        name: activity.fileName,
        type: getFileType(activity.fileName),
        blobType: blob.type,
      });
      setShowPreview(true);

      // console.log("✅ Preview ready");
      console.groupEnd();
    } catch (error) {
      console.error("❌ Network error:", error);
      alert("Network error: " + error.message);
      console.groupEnd();
    }
  };

  // Enhanced download handler
  const handleDownload = async (activity) => {
    console.group("📥 File Download");
    // console.log("Activity:", activity);

    if (!activity.downloadUrl) {
      console.error("❌ No download URL available");
      alert("This file cannot be downloaded (no download URL available)");
      console.groupEnd();
      return;
    }

    try {
      const token = getToken();

      // Use the unified download endpoint
      const filename = activity.downloadUrl.split("/").pop();
      const fullUrl = `${API_URL}/api/activities/download/${activity.tool}/${filename}`;

      // console.log("📡 Downloading from:", fullUrl);

      const response = await fetch(fullUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // console.log("📊 Response:", response.status, response.statusText);

      if (!response.ok) {
        let errorMessage = `Download failed: ${response.status}`;

        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // Ignore JSON parse errors
        }

        alert(errorMessage);
        console.groupEnd();
        return;
      }

      const blob = await response.blob();
      // console.log("📦 Blob received:", blob.size, "bytes");

      if (blob.size === 0) {
        alert("Downloaded file is empty");
        console.groupEnd();
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = activity.fileName || "download";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // console.log("✅ Download completed");
      console.groupEnd();
    } catch (error) {
      console.error("❌ Download error:", error);
      alert("Download failed: " + error.message);
      console.groupEnd();
    }
  };

  // Safe filtering with null checks
  const filteredActivities = activities.filter((activity) => {
    if (!activity) return false;

    const fileName = activity.fileName || "";
    const activityType = activity.type || "";
    const activityTool = activity.tool || "";
    const activityStatus = activity.status || "";

    const matchesSearch =
      !filters.search ||
      fileName.toLowerCase().includes(filters.search.toLowerCase()) ||
      activityType.toLowerCase().includes(filters.search.toLowerCase());

    const matchesTool = filters.tool === "all" || activityTool === filters.tool;
    const matchesStatus =
      filters.status === "all" || activityStatus === filters.status;

    return matchesSearch && matchesTool && matchesStatus;
  });

  const getFileType = (fileName) => {
    if (!fileName) return "file";
    const ext = fileName.split(".").pop()?.toLowerCase() || "";
    if (["pdf"].includes(ext)) return "pdf";
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "image";
    if (["doc", "docx"].includes(ext)) return "document";
    if (["xls", "xlsx"].includes(ext)) return "spreadsheet";
    if (["ppt", "pptx"].includes(ext)) return "presentation";
    return "file";
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return "N/A";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown date";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getToolDisplayName = (tool) => {
    const toolMap = {
      edit: "Edit Tools",
      organize: "Organize Tools",
      security: "Security Tools",
      optimize: "Optimize Tools",
      advanced: "Advanced Tools",
      convert: "Conversions",
    };
    return toolMap[tool] || "Other Tools";
  };

  const getToolIcon = (tool) => {
    const category = toolCategories.find((cat) => cat.id === tool);
    return category ? category.icon : FileText;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      completed: "bg-green-100 text-green-800",
      processing: "bg-yellow-100 text-yellow-800",
      failed: "bg-red-100 text-red-800",
    };
    return colorMap[status] || "bg-gray-100 text-gray-800";
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      tool: "all",
      status: "all",
    });
  };

  const refreshAll = () => {
    fetchActivities();
    fetchStats();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your activities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold gradient-text">All Activities</h1>
            <p className="text-gray-600">
              View and manage your file processing history
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={refreshAll} disabled={loading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 mr-2" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
          <div className="bg-white p-4 rounded-2xl border text-center">
            <div className="text-2xl font-bold text-purple-600">
              {stats.total || 0}
            </div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          {toolCategories
            .filter((tool) => tool.id !== "all")
            .map((tool) => (
              <div
                key={tool.id}
                className="bg-white p-4 rounded-2xl border text-center"
              >
                <div className="text-2xl font-bold text-gray-800">
                  {stats[tool.id] || 0}
                </div>
                <div className="text-sm text-gray-600">{tool.name}</div>
              </div>
            ))}
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mb-6 p-6 bg-white rounded-2xl border shadow-sm"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Activities
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by filename or type..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, search: e.target.value }))
                  }
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Tool Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tool Type
              </label>
              <select
                value={filters.tool}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, tool: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {toolCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, status: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {statusOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </motion.div>
      )}

      {/* Activities List */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        {filteredActivities.length > 0 ? (
          <div className="divide-y">
            {filteredActivities.map((activity, index) => {
              const Icon = getToolIcon(activity.tool);
              const category = toolCategories.find(
                (cat) => cat.id === activity.tool
              );

              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex-shrink-0">
                        <div
                          className={`w-12 h-12 rounded-full ${
                            category?.color || "bg-gray-100"
                          } flex items-center justify-center`}
                        >
                          <Icon className="h-6 w-6" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {activity.fileName}
                        </h3>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {getToolDisplayName(activity.tool)}
                          </span>
                          <span className="text-sm text-gray-500">
                            {formatDate(activity.date)}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
                              activity.status
                            )}`}
                          >
                            {activity.status}
                          </span>
                          {activity.fileSize > 0 && (
                            <span className="text-sm text-gray-500">
                              {formatFileSize(activity.fileSize)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreview(activity)}
                        disabled={!activity.downloadUrl}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(activity)}
                        disabled={!activity.downloadUrl}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              No activities found
            </h3>
            <p className="text-gray-500 mb-4">
              {filters.search ||
              filters.tool !== "all" ||
              filters.status !== "all"
                ? "Try adjusting your filters to see more results"
                : "No activities recorded yet"}
            </p>
            <Button onClick={clearFilters}>Clear Filters</Button>
          </div>
        )}
      </div>

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
                  if (previewFile.url) URL.revokeObjectURL(previewFile.url);
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
                        tool: "download",
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
                    tool: "download",
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
    </div>
  );
};

export default Activities;
