import React, { useEffect, useState, useMemo } from "react";
import AdminLayout from "../../components/AdminLayout/AdminLayout";
import { toast } from "../../components/ui/use-toast";
import * as XLSX from "xlsx"; // Make sure to install: npm install xlsx
const API_URL = import.meta.env.VITE_API_URL;

const Users = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

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

        const res = await fetch(`${API_URL}/api/auth/users`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

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

  const filteredUsers = useMemo(() => {
    return users.filter(
      (user) =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const exportToExcel = () => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(
        filteredUsers.map((user) => ({
          Name: user.name,
          Email: user.email,
          Role: user.role,
          "Joined Date": new Date(user.createdAt).toLocaleDateString(),
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
                <svg
                  style={styles.searchIcon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
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
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                </svg>
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
                      <th style={styles.tableHeaderCell}>Role</th>
                      <th style={styles.tableHeaderCell}>Joined Date</th>
                      <th style={styles.tableHeaderCell}>Status</th>
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
                              ...(user.role === "admin"
                                ? styles.roleAdmin
                                : styles.roleUser),
                            }}
                          >
                            {user.role}
                          </span>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Users;
