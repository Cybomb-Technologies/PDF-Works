import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);
const API_URL = import.meta.env.VITE_API_URL;

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // =====================================================
  // 🧠 INITIAL AUTH CHECK (on app load)
  // =====================================================
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("pdfpro_user");

      if (token && storedUser) {
        // Try validating token & get updated user
        try {
          const response = await fetch(`${API_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.ok) {
            const userInfo = await response.json();
            if (userInfo.success) {
              setUser(userInfo.user);
              localStorage.setItem("pdfpro_user", JSON.stringify(userInfo.user));
              window.dispatchEvent(new Event("user-updated"));
            } else {
              // token invalid → fallback to stored user
              setUser(JSON.parse(storedUser));
            }
          } else {
            // fallback to stored user when token expired
            setUser(JSON.parse(storedUser));
          }
        } catch {
          // Offline or network error → fallback
          setUser(JSON.parse(storedUser));
        }
      } else if (storedUser && !token) {
        // local display without token
        setUser(JSON.parse(storedUser));
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Auth check error:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // 🔄 REFRESH USER DATA (Used after payment / changes)
  // =====================================================
  const refreshUser = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const userInfo = await response.json();
        if (userInfo.success && userInfo.user) {
          setUser(userInfo.user);
          localStorage.setItem("pdfpro_user", JSON.stringify(userInfo.user));
          window.dispatchEvent(new Event("user-updated"));
        }
      }
    } catch (error) {
      console.error("Refresh user failed:", error);
    }
  };

  // =====================================================
  // 🎉 AUTO REFRESH AFTER PAYMENT SUCCESS (Top-up / Plan)
  // =====================================================
  useEffect(() => {
    if (sessionStorage.getItem("topup_success") || sessionStorage.getItem("sub_success")) {
      refreshUser();
      sessionStorage.removeItem("topup_success");
      sessionStorage.removeItem("sub_success");
    }
  }, []);

  // =====================================================
  // 🔐 LOGIN HANDLER
  // =====================================================
  const loginBackend = (userData, token) => {
    const fullUser = { ...userData, token };
    setUser(fullUser);
    localStorage.setItem("pdfpro_user", JSON.stringify(fullUser));
    localStorage.setItem("token", token);
    window.dispatchEvent(new Event("user-updated"));
  };

  // =====================================================
  // 🚪 LOGOUT HANDLER
  // =====================================================
  const logout = () => {
    setUser(null);
    localStorage.removeItem("pdfpro_user");
    localStorage.removeItem("token");
  };

  // =====================================================
  // 🔧 UPDATE USER (Local Update)
  // =====================================================
  const updateUser = (updatedData) => {
    const updatedUser = { ...user, ...updatedData };
    setUser(updatedUser);
    localStorage.setItem("pdfpro_user", JSON.stringify(updatedUser));
    window.dispatchEvent(new Event("user-updated"));
  };

  // =====================================================
  // 💳 UPDATE USER PLAN DATA
  // =====================================================
  const updateUserPlan = (newPlanData) => {
    const updatedUser = {
      ...user,
      plan: newPlanData.plan,
      planName: newPlanData.planName,
      billingCycle: newPlanData.billingCycle,
      subscriptionStatus: newPlanData.subscriptionStatus,
      planExpiry: newPlanData.planExpiry,
    };
    setUser(updatedUser);
    localStorage.setItem("pdfpro_user", JSON.stringify(updatedUser));
    window.dispatchEvent(new Event("user-updated"));

    // 🔔 Trigger refresh on next render
    sessionStorage.setItem("sub_success", "1");
  };

  // =====================================================
  // 🎯 TOKEN GETTER
  // =====================================================
  const getToken = () => localStorage.getItem("token");

  // =====================================================
  // ⚙️ CHECK IF USER CAN PERFORM CONVERSION
  // =====================================================
  const canPerformConversion = async () => {
    if (!user) return false;

    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const userInfo = await response.json();
        if (userInfo.success) {
          const currentUser = userInfo.user;
          setUser(currentUser);
          localStorage.setItem("pdfpro_user", JSON.stringify(currentUser));
          window.dispatchEvent(new Event("user-updated"));

          const usage = currentUser.usage?.conversions || 0;
          const plan = currentUser.planName;

          if (plan === "Free") return usage < 10;
          if (plan === "Starter") return usage < 50;
          if (plan === "Professional") return usage < 500;

          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("Error checking conversion limit:", error);
      return false;
    }
  };

  // =====================================================
  // ➕ INCREMENT CONVERSION COUNT (frontend cache only)
  // =====================================================
  const incrementConversionCount = async () => {
    if (!user) return;
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const userInfo = await response.json();
        if (userInfo.success) {
          const updatedUser = {
            ...userInfo.user,
            usage: {
              ...userInfo.user.usage,
              conversions: (userInfo.user.usage?.conversions || 0) + 1,
            },
          };
          setUser(updatedUser);
          localStorage.setItem("pdfpro_user", JSON.stringify(updatedUser));
           sessionStorage.setItem("sub_success", "1");


           window.dispatchEvent(new Event("user-updated"));
        }
      }
    } catch (error) {
      console.error("Error incrementing conversion count:", error);
    }
  };

  // =====================================================
  // 🧱 PROVIDER VALUES
  // =====================================================
  return (
    <AuthContext.Provider
      value={{
        user,
        loginBackend,
        logout,
        updateUser,
        updateUserPlan,
        getToken,
        canPerformConversion,
        incrementConversionCount,
        refreshUser,         // ➕ ADDED THIS
        loading,
        checkAuthStatus,     // ⚠ kept original
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
