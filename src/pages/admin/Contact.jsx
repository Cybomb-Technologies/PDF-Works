import React, { useEffect, useState, useMemo } from "react";
import AdminLayout from "../../components/AdminLayout/AdminLayout";
import * as XLSX from "xlsx";
const API_URL = import.meta.env.VITE_API_URL;

function ContactUser() {
  const [contacts, setContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const token = localStorage.getItem("pdfpro_admin_token");
        if (!token) {
          throw new Error("No admin token found. Please log in again.");
        }

        const res = await fetch(`${API_URL}/api/contact`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        // Check if response is OK (status 200-299)
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        // console.log("Full API response:", data); // For debugging

        // Handle different possible response structures
        if (data.success && data.contacts) {
          setContacts(data.contacts);
        } else if (Array.isArray(data)) {
          // If response is directly an array
          setContacts(data);
        } else if (data.contacts && Array.isArray(data.contacts)) {
          setContacts(data.contacts);
        } else {
          console.warn("Unexpected data structure:", data);
          setContacts([]); // Set empty array as fallback
        }
      } catch (err) {
        console.error("Failed to fetch contacts:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContacts();
  }, []);

  const filteredContacts = useMemo(() => {
    if (!contacts || !Array.isArray(contacts)) return [];

    return contacts.filter((contact) => {
      if (!contact) return false;

      const searchLower = searchTerm.toLowerCase();
      return (
        contact.name?.toLowerCase().includes(searchLower) ||
        contact.email?.toLowerCase().includes(searchLower) ||
        contact.phone?.toLowerCase().includes(searchLower) ||
        contact.message?.toLowerCase().includes(searchLower)
      );
    });
  }, [contacts, searchTerm]);

  const exportToExcel = () => {
    try {
      if (!filteredContacts.length) {
        alert("No data to export");
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(
        filteredContacts.map((contact) => ({
          Name: contact?.name || "N/A",
          Email: contact?.email || "N/A",
          Phone: contact?.phone || "N/A",
          Message: contact?.message || "No message",
          "Submitted Date": contact?.createdAt
            ? new Date(contact.createdAt).toLocaleDateString()
            : "N/A",
          "Contact ID": contact?._id || "N/A",
          Status: contact?.status || "unread",
        }))
      );

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Contacts");
      XLSX.writeFile(
        workbook,
        `contacts_data_${new Date().toISOString().split("T")[0]}.xlsx`
      );

      alert("Contacts data exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export data");
    }
  };

  // Internal CSS Styles (same as your original styles)
  const styles = {
    container: {
      padding: "30px",
      background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
      minHeight: "100vh",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
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
      backgroundClip: "text",
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
    card: {
      background: "white",
      borderRadius: "20px",
      padding: "30px",
      boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(255, 255, 255, 0.3)",
    },
    statsContainer: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "20px",
      marginBottom: "30px",
    },
    statCard: {
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      color: "white",
      padding: "20px",
      borderRadius: "15px",
      textAlign: "center",
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
    tableContainer: {
      overflow: "hidden",
      borderRadius: "15px",
      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
      background: "white",
      marginTop: "20px",
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
    messageCell: {
      maxWidth: "300px",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
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
    errorContainer: {
      textAlign: "center",
      padding: "40px",
      background: "#fef2f2",
      borderRadius: "15px",
      border: "1px solid #fecaca",
      color: "#dc2626",
    },
    statusBadge: {
      padding: "6px 12px",
      borderRadius: "20px",
      fontSize: "14px",
      fontWeight: "500",
      textTransform: "capitalize",
    },
    statusRead: {
      background: "rgba(34, 197, 94, 0.1)",
      color: "#16a34a",
    },
    statusUnread: {
      background: "rgba(239, 68, 68, 0.1)",
      color: "#dc2626",
    },
  };

  // Add CSS animation for spinner
  React.useEffect(() => {
    const styleSheet = document.styleSheets[0];
    const keyframes = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    if (styleSheet) {
      styleSheet.insertRule(keyframes, styleSheet.cssRules.length);
    }
  }, []);

  return (
    <AdminLayout>
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.header}>
            <h1 style={styles.title}>Contact Messages</h1>
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
                  placeholder="Search contacts by name, email, phone or message..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={styles.searchInput}
                  onFocus={(e) => {
                    Object.assign(e.target.style, styles.searchInputFocus);
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
                  Object.assign(e.target.style, styles.exportButtonHover);
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = styles.exportButton.boxShadow;
                }}
                disabled={filteredContacts.length === 0}
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

          {/* Error Display */}
          {error && (
            <div style={styles.errorContainer}>
              <h3>Error Loading Contacts</h3>
              <p>{error}</p>
              <button
                onClick={() => window.location.reload()}
                style={{
                  ...styles.exportButton,
                  background:
                    "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                  marginTop: "10px",
                }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Statistics Cards */}
          {!error && (
            <div style={styles.statsContainer}>
              <div style={styles.statCard}>
                <div style={styles.statValue}>{contacts.length}</div>
                <div style={styles.statLabel}>Total Contacts</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statValue}>{filteredContacts.length}</div>
                <div style={styles.statLabel}>Filtered Results</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statValue}>
                  {contacts.filter((c) => c?.status === "unread").length}
                </div>
                <div style={styles.statLabel}>Unread Messages</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statValue}>
                  {new Set(contacts.map((c) => c?.email).filter(Boolean)).size}
                </div>
                <div style={styles.statLabel}>Unique Emails</div>
              </div>
            </div>
          )}

          {isLoading ? (
            <div style={styles.loadingContainer}>
              <div style={styles.loadingSpinner}></div>
              <div>Loading contact messages...</div>
            </div>
          ) : (
            <div style={styles.tableContainer}>
              {filteredContacts.length === 0 ? (
                <div style={styles.noData}>
                  {searchTerm
                    ? "No contacts found matching your search."
                    : "No contact messages available."}
                </div>
              ) : (
                <table style={styles.table}>
                  <thead style={styles.tableHeader}>
                    <tr>
                      <th style={styles.tableHeaderCell}>Name</th>
                      <th style={styles.tableHeaderCell}>Email</th>
                      <th style={styles.tableHeaderCell}>Phone</th>
                      <th style={styles.tableHeaderCell}>Message</th>
                      <th style={styles.tableHeaderCell}>Date</th>
                      <th style={styles.tableHeaderCell}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContacts.map((contact, index) => (
                      <tr
                        key={contact?._id || index}
                        style={styles.tableRow}
                        onMouseEnter={(e) => {
                          Object.assign(
                            e.currentTarget.style,
                            styles.tableRowHover
                          );
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "white";
                          e.currentTarget.style.transform = "scale(1)";
                        }}
                      >
                        <td style={styles.tableCell}>
                          <div style={{ fontWeight: "600", color: "#1e293b" }}>
                            {contact?.name || "N/A"}
                          </div>
                        </td>
                        <td style={styles.tableCell}>
                          {contact?.email || "N/A"}
                        </td>
                        <td style={styles.tableCell}>
                          {contact?.phone || "N/A"}
                        </td>
                        <td
                          style={{ ...styles.tableCell, ...styles.messageCell }}
                          title={contact?.message}
                        >
                          {contact?.message || "No message"}
                        </td>
                        <td style={styles.tableCell}>
                          {contact?.createdAt
                            ? new Date(contact.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                }
                              )
                            : "N/A"}
                        </td>
                        <td style={styles.tableCell}>
                          <span
                            style={{
                              ...styles.statusBadge,
                              ...(contact?.status === "read"
                                ? styles.statusRead
                                : styles.statusUnread),
                            }}
                          >
                            {contact?.status || "unread"}
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
}

export default ContactUser;
