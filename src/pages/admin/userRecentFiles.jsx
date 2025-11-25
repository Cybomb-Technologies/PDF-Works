// src/pages/admin/userRecentFiles.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Filter, Search, Download, FileText, Calendar, User } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout/AdminLayout";

const API_URL = import.meta.env.VITE_API_URL;

const UserRecentFiles = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const filesPerPage = 20;

  const getAdminToken = () => {
    const token = localStorage.getItem("pdfpro_admin_token");
    if (!token) {
      toast({
        title: "Authentication Required",
        description: "Please log in as admin",
        variant: "destructive",
      });
      navigate("/admin/login");
      return null;
    }
    return token;
  };

  const fetchRecentFiles = async (page = 1) => {
    try {
      setLoading(true);
      const token = getAdminToken();
      if (!token) return;

      const response = await fetch(
        `${API_URL}/api/admin/dashboard/files?limit=${filesPerPage}&page=${page}`,
        {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        localStorage.removeItem("pdfpro_admin_token");
        navigate("/admin/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch files");
      }

      const data = await response.json();
      
      if (data.success) {
        setFiles(data.files || []);
        setTotalPages(data.totalPages || 1);
        setCurrentPage(data.page || 1);
      } else {
        throw new Error(data.error || "Failed to fetch files");
      }
    } catch (error) {
      console.error("Error fetching recent files:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load files",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentFiles(1);
  }, [navigate]);

  // Filter files based on category and search term
  const filteredFiles = files.filter(file => {
    const matchesCategory = selectedCategory === "all" || file.toolCategory === selectedCategory;
    const matchesSearch = file.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.toolCategory?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Get unique categories
  const categories = ["all", ...new Set(files.map(file => file.toolCategory).filter(Boolean))];

  // Pagination
  const paginatedFiles = filteredFiles;
  const totalFilteredPages = Math.ceil(filteredFiles.length / filesPerPage);

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchRecentFiles(page);
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Previous button
    if (currentPage > 1) {
      pages.push(
        <button
          key="prev"
          onClick={() => handlePageChange(currentPage - 1)}
          className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Previous
        </button>
      );
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-1 border rounded-lg ${
            currentPage === i
              ? "bg-blue-600 text-white border-blue-600"
              : "border-gray-300 hover:bg-gray-50"
          }`}
        >
          {i}
        </button>
      );
    }

    // Next button
    if (currentPage < totalPages) {
      pages.push(
        <button
          key="next"
          onClick={() => handlePageChange(currentPage + 1)}
          className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Next
        </button>
      );
    }

    return pages;
  };

  const styles = {
    container: {
      padding: "30px",
      background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
      minHeight: "100vh",
    },
    card: {
      background: "white",
      borderRadius: "20px",
      padding: "30px",
      boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(255, 255, 255, 0.3)",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "30px",
      flexWrap: "wrap",
      gap: "20px",
    },
    title: {
      fontSize: "32px",
      fontWeight: "700",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      margin: 0,
    },
    searchContainer: {
      display: "flex",
      gap: "15px",
      alignItems: "center",
      flexWrap: "wrap",
    },
    searchBox: {
      position: "relative",
      display: "flex",
      alignItems: "center",
    },
    searchIcon: {
      position: "absolute",
      left: "15px",
      width: "20px",
      height: "20px",
      color: "#667eea",
    },
    searchInput: {
      padding: "12px 20px 12px 45px",
      border: "2px solid #e2e8f0",
      borderRadius: "15px",
      fontSize: "16px",
      width: "300px",
      outline: "none",
      transition: "all 0.3s ease",
      background: "white",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
    },
    searchInputFocus: {
      borderColor: "#667eea",
      boxShadow: "0 8px 15px rgba(102, 126, 234, 0.2)",
      transform: "translateY(-2px)",
    },
    tableContainer: {
      overflow: "hidden",
      borderRadius: "15px",
      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
      background: "white",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      background: "white",
    },
    tableHeader: {
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      color: "white",
    },
    tableHeaderCell: {
      padding: "18px 20px",
      textAlign: "left",
      fontWeight: "600",
      fontSize: "16px",
      borderBottom: "none",
    },
    tableRow: {
      transition: "all 0.3s ease",
      borderBottom: "1px solid #f1f5f9",
    },
    tableRowHover: {
      background: "#f8fafc",
      transform: "scale(1.01)",
    },
    tableCell: {
      padding: "16px 20px",
      border: "none",
      fontSize: "15px",
      color: "#475569",
    },
    loadingContainer: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "60px",
      flexDirection: "column",
      gap: "20px",
    },
    loadingSpinner: {
      width: "50px",
      height: "50px",
      border: "5px solid #f3f3f3",
      borderTop: "5px solid #667eea",
      borderRadius: "50%",
      animation: "spin 1s linear infinite",
    },
    noData: {
      textAlign: "center",
      padding: "60px",
      color: "#64748b",
      fontSize: "18px",
    },
    statsContainer: {
      display: "flex",
      gap: "20px",
      marginBottom: "25px",
      flexWrap: "wrap",
    },
    statCard: {
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      color: "white",
      padding: "20px",
      borderRadius: "15px",
      minWidth: "150px",
      boxShadow: "0 8px 20px rgba(102, 126, 234, 0.3)",
    },
    statValue: {
      fontSize: "32px",
      fontWeight: "700",
      margin: "0 0 5px 0",
    },
    statLabel: {
      fontSize: "14px",
      opacity: "0.9",
      margin: 0,
    },
  };

  // Add CSS animation for spinner
  useEffect(() => {
    const styleSheet = document.styleSheets[0];
    const keyframes = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    styleSheet.insertRule(keyframes, styleSheet.cssRules.length);
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div style={styles.container}>
          <div style={styles.card}>
            <div style={styles.loadingContainer}>
              <div style={styles.loadingSpinner}></div>
              <div>Loading files...</div>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.header}>
            <div>
              <h1 style={styles.title}>Recent Files</h1>
              <p className="text-gray-600 mt-1">
                Browse all files uploaded by users across all tools
              </p>
            </div>
            <div style={styles.searchContainer}>
              <div style={styles.searchBox}>
                <Search
                  style={styles.searchIcon}
                />
                <input
                  type="text"
                  placeholder="Search files, users, or categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={styles.searchInput}
                  onFocus={(e) => {
                    e.target.style.borderColor =
                      styles.searchInputFocus.borderColor;
                    e.target.style.boxShadow =
                      styles.searchInputFocus.boxShadow;
                    e.target.style.transform =
                      styles.searchInputFocus.transform;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = styles.searchInput.borderColor;
                    e.target.style.boxShadow = styles.searchInput.boxShadow;
                    e.target.style.transform = "translateY(0)";
                  }}
                />
              </div>
              
              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category === "all" ? "All Categories" : category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div style={styles.statsContainer}>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{files.length}</div>
              <div style={styles.statLabel}>Total Files</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>
                {new Set(files.map(file => file.userId)).size}
              </div>
              <div style={styles.statLabel}>Active Users</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{filteredFiles.length}</div>
              <div style={styles.statLabel}>Filtered</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>
                {categories.length - 1}
              </div>
              <div style={styles.statLabel}>Categories</div>
            </div>
          </div>

          <div style={styles.tableContainer}>
            {filteredFiles.length === 0 ? (
              <div style={styles.noData}>
                {searchTerm || selectedCategory !== "all" 
                  ? "No files found matching your search criteria."
                  : "No files available."
                }
              </div>
            ) : (
              <table style={styles.table}>
                <thead style={styles.tableHeader}>
                  <tr>
                    <th style={styles.tableHeaderCell}>File Name</th>
                    <th style={styles.tableHeaderCell}>User</th>
                    <th style={styles.tableHeaderCell}>Category</th>
                    <th style={styles.tableHeaderCell}>Size</th>
                    <th style={styles.tableHeaderCell}>Upload Date</th>
                    <th style={styles.tableHeaderCell}>Tool Used</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedFiles.map((file, index) => (
                    <tr
                      key={file._id || index}
                      style={styles.tableRow}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          styles.tableRowHover.background;
                        e.currentTarget.style.transform =
                          styles.tableRowHover.transform;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "white";
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                    >
                      <td style={styles.tableCell}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <FileText className="h-5 w-5 text-blue-600" />
                          <div style={{ fontWeight: "600", color: "#1e293b" }}>
                            {file.displayName || file.filename || 'Unknown File'}
                          </div>
                        </div>
                      </td>
                      <td style={styles.tableCell}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <User className="h-4 w-4 text-gray-500" />
                          {file.userName || 'Unknown user'}
                        </div>
                      </td>
                      <td style={styles.tableCell}>
                        <span
                          style={{
                            padding: "6px 12px",
                            borderRadius: "20px",
                            fontSize: "14px",
                            fontWeight: "500",
                            background: "rgba(102, 126, 234, 0.1)",
                            color: "#667eea",
                            textTransform: "capitalize"
                          }}
                        >
                          {file.toolCategory || file.source}
                        </span>
                      </td>
                      <td style={styles.tableCell}>
                        {file.size ? formatFileSize(file.size) : 'Unknown size'}
                      </td>
                      <td style={styles.tableCell}>
                        {formatDate(file.uploadedAt)}
                      </td>
                      <td style={styles.tableCell}>
                        <span style={{ textTransform: 'capitalize' }}>
                          {file.toolUsed || file.toolCategory}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              {renderPagination()}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default UserRecentFiles;