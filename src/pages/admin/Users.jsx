import React, { useEffect, useState, useMemo } from "react";
import AdminLayout from "../../components/AdminLayout/AdminLayout";
import { toast } from "../../components/ui/use-toast";
import * as XLSX from "xlsx";
import { 
  Eye, 
  Download, 
  Search, 
  Users as UsersIcon,
  Shield,
  Mail,
  Calendar,
  User,
  X
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("pdfpro_admin_token");
        if (!token) {
          toast({
            title: "Error",
            description: "No admin token found",
            variant: "destructive",
          });
          return;
        }

        const res = await fetch(`${API_URL}/api/admin/dashboard/users`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 401) {
          localStorage.removeItem("pdfpro_admin_token");
          toast({
            title: "Session Expired",
            description: "Please login again",
            variant: "destructive",
          });
          return;
        }

        const data = await res.json();
        if (!data.success || !data.users) {
          toast({
            title: "Error",
            description: "Invalid data received",
            variant: "destructive",
          });
          return;
        }

        setUsers(data.users);
      } catch (err) {
        console.error(err);
        toast({
          title: "Error",
          description: "Failed to fetch users",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const filteredUsers = useMemo(() => {
    return users.filter(
      (user) =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.plan?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const exportToExcel = () => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(
        filteredUsers.map((user) => ({
          Name: user.name,
          Email: user.email,
          Role: user.role,
          Plan: user.plan,
          "Files Count": user.files,
          "Storage Used": formatFileSize(user.storageUsed),
          "Joined Date": new Date(user.createdAt).toLocaleDateString(),
          "Last Active": new Date(user.lastActive).toLocaleDateString(),
          "Subscription Status": user.subscriptionStatus,
          "User ID": user._id,
        }))
      );

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
      XLSX.writeFile(
        workbook,
        `users_data_${new Date().toISOString().split("T")[0]}.xlsx`
      );

      toast({
        title: "Success",
        description: "Users data exported successfully!",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive",
      });
    }
  };

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

  const formatDateShort = (dateString) => {
    if (!dateString) return 'Unknown date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPlanColor = (planName) => {
    const planColors = {
      "Free": "text-gray-600 bg-gray-100",
      "Pro": "text-purple-600 bg-purple-100",
      "Professional": "text-purple-600 bg-purple-100",
      "Business": "text-blue-600 bg-blue-100",
      "Enterprise": "text-blue-600 bg-blue-100",
      "Starter": "text-green-600 bg-green-100",
      "Premium": "text-orange-600 bg-orange-100"
    };
    return planColors[planName] || "text-gray-600 bg-gray-100";
  };

  // User Details Modal Component
  const UserDetailsModal = () => {
    if (!isModalOpen || !selectedUser) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">User Details</h2>
              <p className="text-gray-600">Complete user information</p>
            </div>
            <button
              onClick={closeModal}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-6 w-6 text-gray-500" />
            </button>
          </div>

          {/* Content with hidden scrollbar */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 [scrollbar-width:none] [-ms-overflow-style:none]">
            <style>
              {`
                .overflow-y-auto::-webkit-scrollbar {
                  display: none;
                }
              `}
            </style>
            
            {/* User Profile */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-semibold text-2xl">
                {selectedUser.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedUser.name}</h3>
                <p className="text-gray-600 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {selectedUser.email}
                </p>
              </div>
            </div>

            {/* User Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Basic Information
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">User ID:</span>
                    <code className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                      {selectedUser._id?.slice(-8)}
                    </code>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Role:</span>
                    <span className="font-medium text-gray-900 capitalize">
                      {selectedUser.role || 'user'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Subscription Status:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      selectedUser.subscriptionStatus === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedUser.subscriptionStatus || 'active'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Plan Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-purple-600" />
                  Plan Details
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Current Plan:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getPlanColor(selectedUser.plan)}`}>
                      {selectedUser.plan}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Plan Type:</span>
                    <span className="font-medium text-gray-900 capitalize">
                      {selectedUser.planType}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Files Count:</span>
                    <span className="font-medium text-gray-900">{selectedUser.files}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Storage & Activity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <UsersIcon className="h-5 w-5 text-green-600" />
                  Storage Usage
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Storage Used:</span>
                    <span className="font-medium text-gray-900">
                      {formatFileSize(selectedUser.storageUsed)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500"
                      style={{ width: `${Math.min((selectedUser.storageUsed / (1024 * 1024 * 1024)) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 text-center">
                    {Math.round((selectedUser.storageUsed / (1024 * 1024 * 1024)) * 100)}% of 1GB used
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-orange-600" />
                  Activity
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Member Since:</span>
                    <span className="font-medium text-gray-900">
                      {formatDateShort(selectedUser.createdAt)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Last Active:</span>
                    <span className="font-medium text-gray-900">
                      {formatDateShort(selectedUser.lastActive)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Status:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      selectedUser.lastActive && new Date(selectedUser.lastActive) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedUser.lastActive && new Date(selectedUser.lastActive) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                        ? 'Active'
                        : 'Inactive'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
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
    exportButton: {
      background: "linear-gradient(135deg, #4CAF50 0%, #45a049 100%)",
      color: "white",
      border: "none",
      padding: "12px 25px",
      borderRadius: "15px",
      fontSize: "16px",
      fontWeight: "600",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      transition: "all 0.3s ease",
      boxShadow: "0 4px 15px rgba(76, 175, 80, 0.3)",
    },
    exportButtonHover: {
      transform: "translateY(-2px)",
      boxShadow: "0 8px 25px rgba(76, 175, 80, 0.4)",
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
    roleBadge: {
      padding: "6px 12px",
      borderRadius: "20px",
      fontSize: "14px",
      fontWeight: "500",
      textTransform: "capitalize",
    },
    roleUser: {
      background: "rgba(102, 126, 234, 0.1)",
      color: "#667eea",
    },
    roleAdmin: {
      background: "rgba(236, 72, 153, 0.1)",
      color: "#ec4899",
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
  const styleSheet = document.styleSheets[0];
  const keyframes = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  styleSheet.insertRule(keyframes, styleSheet.cssRules.length);

  return (
    <AdminLayout>
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.header}>
            <h1 style={styles.title}>Users Management</h1>
            <div style={styles.searchContainer}>
              <div style={styles.searchBox}>
                <Search
                  style={styles.searchIcon}
                />
                <input
                  type="text"
                  placeholder="Search users by name, email or role..."
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
              <button
                onClick={exportToExcel}
                style={styles.exportButton}
                onMouseEnter={(e) => {
                  e.target.style.transform = styles.exportButtonHover.transform;
                  e.target.style.boxShadow = styles.exportButtonHover.boxShadow;
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = styles.exportButton.boxShadow;
                }}
              >
                <Download size={18} />
                Export to Excel
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div style={styles.statsContainer}>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{users.length}</div>
              <div style={styles.statLabel}>Total Users</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>
                {users.filter((u) => u.role === "admin").length}
              </div>
              <div style={styles.statLabel}>Admins</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{filteredUsers.length}</div>
              <div style={styles.statLabel}>Filtered</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>
                {users.filter(u => u.plan && u.plan !== 'Free').length}
              </div>
              <div style={styles.statLabel}>Paying Users</div>
            </div>
          </div>

          {isLoading ? (
            <div style={styles.loadingContainer}>
              <div style={styles.loadingSpinner}></div>
              <div>Loading users...</div>
            </div>
          ) : (
            <div style={styles.tableContainer}>
              {filteredUsers.length === 0 ? (
                <div style={styles.noData}>
                  {searchTerm
                    ? "No users found matching your search."
                    : "No users available."}
                </div>
              ) : (
                <table style={styles.table}>
                  <thead style={styles.tableHeader}>
                    <tr>
                      <th style={styles.tableHeaderCell}>Name</th>
                      <th style={styles.tableHeaderCell}>Email</th>
                      <th style={styles.tableHeaderCell}>Plan</th>
                      <th style={styles.tableHeaderCell}>Role</th>
                      <th style={styles.tableHeaderCell}>Files</th>
                      <th style={styles.tableHeaderCell}>Joined Date</th>
                      <th style={styles.tableHeaderCell}>Status</th>
                      <th style={styles.tableHeaderCell}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user, index) => (
                      <tr
                        key={user._id}
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
                          <div style={{ fontWeight: "600", color: "#1e293b" }}>
                            {user.name}
                          </div>
                        </td>
                        <td style={styles.tableCell}>{user.email}</td>
                        <td style={styles.tableCell}>
                          <span
                            style={{
                              ...styles.roleBadge,
                              ...(user.plan === "Free" ? styles.roleUser : styles.roleAdmin),
                            }}
                          >
                            {user.plan}
                          </span>
                        </td>
                        <td style={styles.tableCell}>
                          <span
                            style={{
                              ...styles.roleBadge,
                              ...(user.role === "admin"
                                ? styles.roleAdmin
                                : styles.roleUser),
                            }}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td style={styles.tableCell}>
                          <div style={{ textAlign: "center" }}>
                            {user.files}
                          </div>
                        </td>
                        <td style={styles.tableCell}>
                          {new Date(user.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </td>
                        <td style={styles.tableCell}>
                          <span
                            style={{
                              padding: "4px 12px",
                              borderRadius: "12px",
                              fontSize: "12px",
                              fontWeight: "600",
                              background: "#10b981",
                              color: "white",
                            }}
                          >
                            Active
                          </span>
                        </td>
                        <td style={styles.tableCell}>
                          <button 
                            onClick={() => handleViewUser(user)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "6px 12px",
                              background: "#3b82f6",
                              color: "white",
                              border: "none",
                              borderRadius: "8px",
                              fontSize: "12px",
                              cursor: "pointer",
                              transition: "all 0.3s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = "#2563eb";
                              e.target.style.transform = "translateY(-1px)";
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = "#3b82f6";
                              e.target.style.transform = "translateY(0)";
                            }}
                          >
                            <Eye size={14} />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>

      {/* User Details Modal */}
      <UserDetailsModal />
    </AdminLayout>
  );
};

export default UsersManagement;