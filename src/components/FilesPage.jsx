// FilesPage.jsx - ENHANCED WITH PROFESSIONAL DELETE MODAL & TOAST NOTIFICATIONS
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  FileText,
  Download,
  Trash2,
  Calendar,
  File,
  Eye,
  LogIn,
  UserPlus,
  RefreshCw,
  Filter,
  FolderOpen,
  Settings,
  Merge,
  BarChart3,
  Crop,
  Shield,
  Archive,
  Zap,
  ChevronLeft,
  ChevronRight,
  Check,
  DownloadCloud,
  Trash,
  MoreHorizontal,
  AlertTriangle,
  X,
  CheckCircle,
  AlertCircle,
  Info
} from "lucide-react";
const API_URL = import.meta.env.VITE_API_URL;
import Metatags from "../SEO/metatags";

// Helper functions defined outside components
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Toast Component
const Toast = ({ message, type, onClose }) => {
  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-500" />,
    error: <AlertCircle className="h-5 w-5 text-red-500" />,
    warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />
  };

  const styles = {
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
    info: "bg-blue-50 border-blue-200 text-blue-800"
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-lg border-l-4 ${styles[type]} max-w-sm`}
    >
      <div className="flex items-center gap-3">
        {icons[type]}
        <div className="flex-1 font-medium text-sm">{message}</div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
};

// Delete Confirmation Modal Component
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, file, isBulk, count, loading }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {isBulk ? `Delete ${count} Files` : 'Delete File'}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    This action cannot be undone
                  </p>
                </div>
              </div>

              {isBulk ? (
                <p className="text-gray-700 mb-6">
                  Are you sure you want to delete <strong>{count} files</strong>? 
                  This will permanently remove all selected files from your account.
                </p>
              ) : (
                <div className="mb-6">
                  <p className="text-gray-700 mb-3">
                    Are you sure you want to delete this file?
                  </p>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-gray-600 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900 truncate">
                          {file?.displayName || file?.filename}
                        </div>
                        <div className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                          <span>{file?.size ? formatFileSize(file.size) : 'Unknown size'}</span>
                          <span>•</span>
                          <span>{file?.uploadedAt ? formatDate(file.uploadedAt) : 'Unknown date'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={loading}
                  className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 font-medium flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const FilesPage = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTool, setSelectedTool] = useState("all");
  const [showSearchFilters, setShowSearchFilters] = useState(false);
  const [stats, setStats] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);
  const [sortBy, setSortBy] = useState("newest");
  
  // Delete modal states
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    file: null,
    isBulk: false,
    count: 0,
    loading: false
  });

  // Toast states
  const [toasts, setToasts] = useState([]);

  // Categories with icons
  const categories = [
    { value: "all", label: "All Files", icon: FolderOpen, color: "gray" },
    { value: "converted", label: "Converted", icon: Settings, color: "blue" },
    { value: "organized", label: "Organized", icon: Merge, color: "green" },
    { value: "optimized", label: "Optimized", icon: BarChart3, color: "purple" },
    { value: "edited", label: "Edited", icon: Crop, color: "orange" },
    { value: "secured", label: "Secured", icon: Shield, color: "red" },
    { value: "advanced", label: "Advanced", icon: Zap, color: "indigo" }
  ];

  // Tool types
  const toolTypes = [
    { value: "all", label: "All Tools" },
    { value: "convert", label: "Convert Tools" },
    { value: "merge", label: "Merge PDF" },
    { value: "split", label: "Split PDF" },
    { value: "rotate", label: "Rotate PDF" },
    { value: "image-optimization", label: "Image Optimize" },
    { value: "pdf-edit", label: "PDF Edit" },
    { value: "image-crop", label: "Image Crop" },
    { value: "file-rename", label: "File Rename" },
    { value: "encryption", label: "Encryption" },
    { value: "decryption", label: "Decryption" },
    { value: "2fa-protection", label: "2FA Protection" }
  ];

  // Sort options
  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "largest", label: "Largest First" },
    { value: "smallest", label: "Smallest First" },
    { value: "name-asc", label: "Name A-Z" },
    { value: "name-desc", label: "Name Z-A" }
  ];

  // Get token from localStorage
  const getToken = () => {
    return localStorage.getItem("token");
  };

  // Toast management
  const showToast = (message, type = "info") => {
    const id = Date.now().toString();
    const newToast = { id, message, type };
    setToasts(prev => [...prev, newToast]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const fetchFiles = async () => {
    try {
      setError("");
      setLoading(true);
      const token = getToken();

      if (!token) {
        setError("Please log in to view your files");
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_URL}/api/files`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          setError("Session expired. Please log in again.");
          localStorage.removeItem("token");
        } else if (res.status === 404) {
          setError("Files endpoint not found. Please check if the server is running.");
        } else {
          throw new Error(`Failed to fetch files: ${res.status}`);
        }
        return;
      }

      const data = await res.json();
      setFiles(data);
      console.log("📁 Files loaded from ALL tools:", data.length);
    } catch (err) {
      console.error("Fetch files error:", err);
      setError("Failed to connect to server. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const res = await fetch(`${API_URL}/api/files/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  useEffect(() => {
    fetchFiles();
    fetchStats();
  }, []);

  // Filter and sort files
  const filteredAndSortedFiles = files
    .filter((file) => {
      const matchesSearch = file.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           file.displayName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "all" || file.category === selectedCategory;
      const matchesTool = selectedTool === "all" || 
                         file.toolUsed === selectedTool || 
                         file.toolCategory === selectedTool;
      
      return matchesSearch && matchesCategory && matchesTool;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.uploadedAt) - new Date(a.uploadedAt);
        case "oldest":
          return new Date(a.uploadedAt) - new Date(b.uploadedAt);
        case "largest":
          return (b.size || 0) - (a.size || 0);
        case "smallest":
          return (a.size || 0) - (b.size || 0);
        case "name-asc":
          return (a.displayName || a.filename).localeCompare(b.displayName || b.filename);
        case "name-desc":
          return (b.displayName || b.filename).localeCompare(a.displayName || a.filename);
        default:
          return new Date(b.uploadedAt) - new Date(a.uploadedAt);
      }
    });

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedFiles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentFiles = filteredAndSortedFiles.slice(startIndex, startIndex + itemsPerPage);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      if (endPage < totalPages) {
        pages.push("...");
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  // Bulk operations
  const handleSelectAll = () => {
    if (selectedFiles.size === currentFiles.length) {
      setSelectedFiles(new Set());
    } else {
      const allIds = new Set(currentFiles.map(file => file._id));
      setSelectedFiles(allIds);
    }
  };

  const handleSelectFile = (fileId) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFiles(newSelected);
  };

  const handleBulkDownload = async () => {
    if (selectedFiles.size === 0) {
      showToast("Please select files to download", "warning");
      return;
    }

    const token = getToken();
    if (!token) {
      showToast("Please log in to download files", "warning");
      return;
    }

    try {
      // Download each selected file individually
      for (const fileId of selectedFiles) {
        const file = files.find(f => f._id === fileId);
        if (file) {
          await downloadSingleFile(file, token);
        }
      }
      showToast(`${selectedFiles.size} files downloaded successfully`, "success");
    } catch (error) {
      console.error("Bulk download error:", error);
      showToast("Some files failed to download", "error");
    }
  };

  // Delete modal functions
  const openDeleteModal = (file = null) => {
    if (file) {
      // Single file delete
      setDeleteModal({
        isOpen: true,
        file,
        isBulk: false,
        count: 1,
        loading: false
      });
    } else {
      // Bulk delete
      setDeleteModal({
        isOpen: true,
        file: null,
        isBulk: true,
        count: selectedFiles.size,
        loading: false
      });
    }
  };

  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      file: null,
      isBulk: false,
      count: 0,
      loading: false
    });
  };

  // Handle actual deletion
  const handleDeleteConfirm = async () => {
    setDeleteModal(prev => ({ ...prev, loading: true }));

    try {
      const token = getToken();
      if (!token) {
        showToast("Please log in to delete files", "warning");
        closeDeleteModal();
        return;
      }

      if (deleteModal.isBulk) {
        // Bulk delete
        const deletePromises = Array.from(selectedFiles).map(fileId =>
          fetch(`${API_URL}/api/files/${fileId}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          })
        );

        await Promise.all(deletePromises);
        
        // Refresh files and stats
        fetchFiles();
        fetchStats();
        
        // Clear selection
        setSelectedFiles(new Set());
        
        showToast(`${deleteModal.count} files deleted successfully`, "success");
      } else {
        // Single file delete
        const file = deleteModal.file;
        const res = await fetch(`${API_URL}/api/files/${file._id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          if (res.status === 401) {
            showToast("Session expired. Please log in again.", "error");
            localStorage.removeItem("token");
          } else {
            throw new Error("Failed to delete file");
          }
          return;
        }

        // Remove from local state
        setFiles((prev) => prev.filter((f) => f._id !== file._id));
        
        // Remove from selection if selected
        const newSelected = new Set(selectedFiles);
        newSelected.delete(file._id);
        setSelectedFiles(newSelected);
        
        // Refresh stats
        fetchStats();
        
        showToast(`"${file.displayName || file.filename}" deleted successfully`, "success");
      }
    } catch (err) {
      console.error("Delete error:", err);
      showToast("Failed to delete file", "error");
    } finally {
      closeDeleteModal();
    }
  };

  const downloadSingleFile = async (file, token) => {
    try {
      let downloadUrl;
      
      if (file.type === 'batch' && file.batchInfo?.batchId) {
        downloadUrl = `${API_URL}/api/files/download-batch/${file.batchInfo.batchId}`;
      } else {
        downloadUrl = `${API_URL}/api/files/download/${file._id}`;
      }

      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = file.displayName || file.filename || 'download';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  };

  const handlePreview = async (file) => {
    const token = getToken();
    
    if (!token) {
      showToast("Please log in to preview files", "warning");
      return;
    }
    
    if (file.type === 'batch') {
      showToast("Batch files need to be downloaded as ZIP", "info");
      return;
    }

    try {
      const previewUrl = `${API_URL}/api/files/download/${file._id}`;

      const response = await fetch(previewUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          showToast("Session expired. Please log in again.", "error");
          localStorage.removeItem("token");
          return;
        }
        throw new Error(`Preview failed: ${response.status}`);
      }

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const newTab = window.open(objectUrl, '_blank');
      
      if (newTab) {
        newTab.onload = () => {
          window.URL.revokeObjectURL(objectUrl);
        };
      } else {
        const a = document.createElement('a');
        a.href = objectUrl;
        a.target = '_blank';
        a.click();
        setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000);
      }

    } catch (error) {
      console.error('❌ Preview error:', error);
      showToast('Preview failed. Please try again.', "error");
    }
  };

  const handleDownload = async (file, e) => {
    e.preventDefault();
    const token = getToken();
    
    if (!token) {
      showToast("Please log in to download files", "warning");
      return;
    }

    try {
      await downloadSingleFile(file, token);
      showToast(`"${file.displayName || file.filename}" downloaded successfully`, "success");
    } catch (error) {
      console.error('❌ Download error:', error);
      showToast('Download failed. Please try again.', "error");
    }
  };

  const clearAuthData = () => {
    const authKeys = [
      "token",
      "hrms_token",
      "adminToken",
      "pdfpro_user",
      "user",
      "adminUser",
    ];
    authKeys.forEach((key) => {
      localStorage.removeItem(key);
    });
    window.location.href = "/login";
  };

  const getCategoryIcon = (category) => {
    const cat = categories.find(c => c.value === category) || categories[0];
    const IconComponent = cat.icon;
    return <IconComponent className={`h-4 w-4 text-${cat.color}-500`} />;
  };

  const getToolBadgeColor = (tool) => {
    const colors = {
      'convert': 'blue', 'pdf-to-image': 'blue', 'image-to-pdf': 'green', 
      'merge': 'purple', 'split': 'orange', 'rotate': 'pink', 
      'image-optimization': 'teal', 'pdf-edit': 'indigo', 'image-crop': 'amber', 
      'file-rename': 'cyan', 'encryption': 'red', 'decryption': 'red',
      '2fa-protection': 'violet', 'automation': 'gray', 'api-connect': 'gray'
    };
    return colors[tool] || 'gray';
  };

  const getToolDisplayName = (tool) => {
    const names = {
      'pdf-to-image': 'PDF to Image',
      'image-to-pdf': 'Image to PDF',
      'merge': 'Merge PDF',
      'split': 'Split PDF', 
      'rotate': 'Rotate PDF',
      'image-optimization': 'Image Optimize',
      'pdf-edit': 'PDF Edit',
      'image-crop': 'Image Crop',
      'file-rename': 'File Rename',
      'encryption': 'Encryption',
      'decryption': 'Decryption',
      '2fa-protection': '2FA Protection',
      'automation': 'Automation',
      'api-connect': 'API Connect'
    };
    return names[tool] || tool;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="flex items-center gap-3 text-gray-600">
          <RefreshCw className="h-5 w-5 animate-spin" />
          Loading files from all tools...
        </div>
      </div>
    );
  }

  const metaPropsData = {
    title: "My Files - All Processed Files | PDF Works",
    description: "Access and manage all your processed files from all tools. View, download, and organize your converted, organized, optimized, edited, and secured files in one place.",
    keyword: "all files, file management, processed files, tool files, download files, file organizer",
    image: "https://res.cloudinary.com/dcfjt8shw/image/upload/v1761288318/wn8m8g8skdpl6iz2rwoa.svg",
    url: "https://pdfworks.in/files",
  };

  return (
    <>
      <Metatags metaProps={metaPropsData} />
      
      {/* Toast Container */}
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteConfirm}
        file={deleteModal.file}
        isBulk={deleteModal.isBulk}
        count={deleteModal.count}
        loading={deleteModal.loading}
      />

      <div className="space-y-6 p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold gradient-text">My Files 📁</h1>
              <p className="text-muted-foreground">
                Manage all your processed files from ALL tools
              </p>
            </div>
          </div>

          {/* Stats Overview */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-effect rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.stats?.total || 0}</div>
                <div className="text-sm text-muted-foreground">Total Files</div>
              </div>
              <div className="glass-effect rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{stats.stats?.convert || 0}</div>
                <div className="text-sm text-muted-foreground">Converted</div>
              </div>
              <div className="glass-effect rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.stats?.organize || 0}</div>
                <div className="text-sm text-muted-foreground">Organized</div>
              </div>
              <div className="glass-effect rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.stats?.edit || 0}</div>
                <div className="text-sm text-muted-foreground">Edited</div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Enhanced Search Bar with Filters */}
        <div className="glass-effect rounded-2xl p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search files by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-transparent border-none focus:outline-none focus:ring-0"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowSearchFilters(!showSearchFilters)}
              className="flex items-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Filter className="h-4 w-4" />
              Filters
              {showSearchFilters && <span className="text-xs">▲</span>}
              {!showSearchFilters && <span className="text-xs">▼</span>}
            </button>
          </div>

          {/* Expandable Filters */}
          {showSearchFilters && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200"
            >
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-2 bg-transparent border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tool Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">Tool</label>
                <select
                  value={selectedTool}
                  onChange={(e) => setSelectedTool(e.target.value)}
                  className="w-full p-2 bg-transparent border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {toolTypes.map(tool => (
                    <option key={tool.value} value={tool.value}>
                      {tool.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full p-2 bg-transparent border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </motion.div>
          )}
        </div>

        {/* Bulk Operations Bar */}
        {selectedFiles.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-effect rounded-xl p-4 bg-blue-50 border border-blue-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-800">
                  {selectedFiles.size} file{selectedFiles.size > 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleBulkDownload}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <DownloadCloud className="h-4 w-4" />
                  Download Selected
                </button>
                <button
                  onClick={() => openDeleteModal()}
                  className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash className="h-4 w-4" />
                  Delete Selected
                </button>
                <button
                  onClick={() => setSelectedFiles(new Set())}
                  className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-effect rounded-2xl p-8 text-center border border-red-200 text-red-700"
          >
            <File className="h-16 w-16 mx-auto mb-4 text-red-500" />
            <h3 className="text-xl font-semibold mb-2">
              Authentication Required
            </h3>
            <p className="text-red-600 mb-4">{error}</p>

            <div className="flex justify-center gap-3 flex-wrap">
              <button
                onClick={clearAuthData}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 transition-colors"
              >
                <LogIn className="h-4 w-4" />
                Clear & Re-login
              </button>
              <button
                onClick={() => (window.location.href = "/login")}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
              >
                <LogIn className="h-4 w-4" />
                Go to Login
              </button>
              <button
                onClick={() => (window.location.href = "/signup")}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                Sign Up
              </button>
            </div>
          </motion.div>
        )}

        {/* File List */}
        {!error && currentFiles.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-effect rounded-2xl p-12 text-center"
          >
            <File className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">
              {searchTerm || selectedCategory !== 'all' || selectedTool !== 'all' ? "No files found" : "No files yet"}
            </h3>
            <p className="text-muted-foreground">
              {searchTerm || selectedCategory !== 'all' || selectedTool !== 'all' 
                ? "Try adjusting your filters to find what you're looking for."
                : "Process your first file using any tool to get started!"}
            </p>
          </motion.div>
        ) : (
          !error && (
            <>
              {/* File List Header */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {Math.min(currentFiles.length, itemsPerPage)} of {filteredAndSortedFiles.length} files
                  {searchTerm && ` for "${searchTerm}"`}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <button
                    onClick={handleSelectAll}
                    className="flex items-center gap-2 px-3 py-1 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    <Check className="h-3 w-3" />
                    {selectedFiles.size === currentFiles.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
              </div>

              {/* File List */}
              <div className="grid grid-cols-1 gap-3">
                {currentFiles.map((file, index) => (
                  <motion.div
                    key={file._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className={`glass-effect rounded-xl p-4 hover-lift transition-all duration-200 ${
                      selectedFiles.has(file._id) ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Checkbox for selection */}
                      <button
                        onClick={() => handleSelectFile(file._id)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          selectedFiles.has(file._id)
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-gray-300 hover:border-blue-500'
                        }`}
                      >
                        {selectedFiles.has(file._id) && <Check className="h-3 w-3" />}
                      </button>

                      {/* File Icon */}
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        {file.type === 'batch' ? (
                          <Archive className="h-6 w-6 text-white" />
                        ) : (
                          <FileText className="h-6 w-6 text-white" />
                        )}
                      </div>

                      {/* File Info */}
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate text-foreground">
                            {file.displayName || file.filename}
                          </h3>
                          {file.type === 'batch' && (
                            <span className="px-2 py-1 bg-cyan-100 text-cyan-800 text-xs rounded-full">
                              Batch ({file.batchInfo?.totalFiles || 0} files)
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                          <span>{formatFileSize(file.size)}</span>
                          <span>•</span>
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(file.uploadedAt)}</span>
                          <span>•</span>
                          <span className={`px-2 py-1 rounded-full text-xs bg-${getToolBadgeColor(file.toolUsed)}-100 text-${getToolBadgeColor(file.toolUsed)}-800`}>
                            {getToolDisplayName(file.toolUsed)}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 capitalize">
                            {getCategoryIcon(file.category)}
                            {file.category}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-1">
                        <button
                          onClick={() => handlePreview(file)}
                          className="p-2 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Preview"
                          disabled={file.type === 'batch'}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => handleDownload(file, e)}
                          className="p-2 text-muted-foreground hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(file)}
                          className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex items-center gap-1">
                    {/* Previous Button */}
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    {/* Page Numbers */}
                    {getPageNumbers().map((page, index) => (
                      <button
                        key={index}
                        onClick={() => typeof page === 'number' ? setCurrentPage(page) : null}
                        className={`min-w-[40px] h-10 rounded-lg transition-colors ${
                          page === currentPage
                            ? 'bg-blue-600 text-white'
                            : page === '...'
                            ? 'cursor-default'
                            : 'hover:bg-gray-100'
                        }`}
                        disabled={page === '...'}
                      >
                        {page}
                      </button>
                    ))}

                    {/* Next Button */}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )
        )}
      </div>
    </>
  );
};

export default FilesPage;