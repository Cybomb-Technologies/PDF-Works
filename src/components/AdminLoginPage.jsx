import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
const API_URL = import.meta.env.VITE_API_URL;

const AdminLoginPage = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem("pdfpro_admin_token", data.token);
        localStorage.setItem("pdfpro_admin", JSON.stringify(data.admin));
        toast({ title: "Admin logged in!", description: data.message });
        navigate("/admin/dashboard");
      } else {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Server error",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Internal CSS Styles
  const styles = {
    container: {
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    },
    formContainer: {
      background: "white",
      padding: "40px",
      borderRadius: "20px",
      boxShadow: "0 25px 50px rgba(0, 0, 0, 0.2)",
      width: "100%",
      maxWidth: "450px",
      border: "1px solid rgba(255, 255, 255, 0.3)",
    },
    title: {
      fontSize: "32px",
      fontWeight: "700",
      textAlign: "center",
      marginBottom: "30px",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
    },
    formGroup: {
      marginBottom: "25px",
    },
    label: {
      display: "block",
      marginBottom: "8px",
      fontWeight: "600",
      color: "#374151",
      fontSize: "14px",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
    },
    input: {
      width: "100%",
      padding: "15px 20px",
      border: "2px solid #e5e7eb",
      borderRadius: "12px",
      fontSize: "16px",
      transition: "all 0.3s ease",
      outline: "none",
      background: "white",
      boxSizing: "border-box",
    },
    inputFocus: {
      borderColor: "#667eea",
      boxShadow: "0 0 0 3px rgba(102, 126, 234, 0.1)",
    },
    button: {
      width: "100%",
      padding: "16px",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      color: "white",
      border: "none",
      borderRadius: "12px",
      fontSize: "16px",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.3s ease",
      position: "relative",
      overflow: "hidden",
      boxShadow: "0 8px 25px rgba(102, 126, 234, 0.3)",
    },
    buttonHover: {
      transform: "translateY(-3px)",
      boxShadow: "0 15px 35px rgba(102, 126, 234, 0.4)",
    },
    buttonLoading: {
      opacity: "0.8",
      cursor: "not-allowed",
    },
    loadingSpinner: {
      display: "inline-block",
      width: "20px",
      height: "20px",
      border: "3px solid rgba(255, 255, 255, 0.3)",
      borderTop: "3px solid white",
      borderRadius: "50%",
      animation: "spin 1s linear infinite",
      marginRight: "10px",
    },
    footerText: {
      textAlign: "center",
      marginTop: "20px",
      color: "#6b7280",
      fontSize: "14px",
    },
  };

  return (
    <>
      {/* Global Styles */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>

      <div style={styles.container}>
        <div style={styles.formContainer}>
          <h1 style={styles.title}>Admin Login</h1>

          <form onSubmit={handleSubmit}>
            <div style={styles.formGroup}>
              <Label htmlFor="email" style={styles.label}>
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                style={styles.input}
                onFocus={(e) => {
                  e.target.style.borderColor = styles.inputFocus.borderColor;
                  e.target.style.boxShadow = styles.inputFocus.boxShadow;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = styles.input.borderColor;
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            <div style={styles.formGroup}>
              <Label htmlFor="password" style={styles.label}>
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
                style={styles.input}
                onFocus={(e) => {
                  e.target.style.borderColor = styles.inputFocus.borderColor;
                  e.target.style.boxShadow = styles.inputFocus.boxShadow;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = styles.input.borderColor;
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              style={{
                ...styles.button,
                ...(isLoading && styles.buttonLoading),
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.transform =
                    styles.buttonHover.transform;
                  e.currentTarget.style.boxShadow =
                    styles.buttonHover.boxShadow;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = styles.button.boxShadow;
              }}
            >
              {isLoading ? (
                <>
                  <div style={styles.loadingSpinner}></div>
                  Signing In...
                </>
              ) : (
                "Sign In to Dashboard"
              )}
            </Button>
          </form>

          <div style={styles.footerText}>Secure Admin Access</div>
        </div>
      </div>
    </>
  );
};

export default AdminLoginPage;
