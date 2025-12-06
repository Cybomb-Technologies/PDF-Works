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

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("pdfpro_user");

      if (token && storedUser) {
        try {
          // Verify token is still valid by making API call
          const response = await fetch(`${API_URL}/api/auth/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const userInfo = await response.json();
            if (userInfo.success) {
              setUser(userInfo.user);
              localStorage.setItem("pdfpro_user", JSON.stringify(userInfo.user));
            } else {
              // Token is invalid, but we'll still use stored user for display
              console.log("Token invalid, using stored user data");
              if (storedUser) {
                try {
                  const parsedUser = JSON.parse(storedUser);
                  setUser(parsedUser);
                } catch (parseError) {
                  console.error("Failed to parse stored user:", parseError);
                }
              }
            }
          } else if (response.status === 401) {
            // Token expired or invalid, but we can still use stored user
            console.log("Token expired, using stored user for display");
            if (storedUser) {
              try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
              } catch (parseError) {
                console.error("Failed to parse stored user:", parseError);
              }
            }
          } else {
            // Other error, still try to use stored user
            console.log("Auth check failed, using stored user");
            if (storedUser) {
              try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
              } catch (parseError) {
                console.error("Failed to parse stored user:", parseError);
              }
            }
          }
        } catch (error) {
          console.error("Token validation error:", error);
          // Network error or other issue, use stored user if available
          if (storedUser) {
            try {
              const parsedUser = JSON.parse(storedUser);
              setUser(parsedUser);
            } catch (parseError) {
              console.error("Failed to parse stored user:", parseError);
            }
          }
        }
      } else if (storedUser && !token) {
        // If we have user data but no token, use the stored user for display
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        } catch (parseError) {
          console.error("Failed to parse stored user:", parseError);
        }
      } else {
        // No stored user, set loading to false
        setUser(null);
      }
    } catch (error) {
      console.error("Auth check error:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const loginBackend = (userData, token) => {
    const fullUser = {
      ...userData,
      token: token,
    };

    setUser(fullUser);
    localStorage.setItem("pdfpro_user", JSON.stringify(fullUser));
    localStorage.setItem("token", token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("pdfpro_user");
    localStorage.removeItem("token");
  };

  const updateUser = (updatedData) => {
    const updatedUser = { ...user, ...updatedData };
    setUser(updatedUser);
    localStorage.setItem("pdfpro_user", JSON.stringify(updatedUser));
  };

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
  };

  const getToken = () => {
    return localStorage.getItem("token");
  };

  const canPerformConversion = async () => {
    if (!user) return false;

    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userInfo = await response.json();
        if (userInfo.success) {
          const currentUser = userInfo.user;

          // Update local user state
          setUser(currentUser);
          localStorage.setItem("pdfpro_user", JSON.stringify(currentUser));

          // Check conversion limits
          if (currentUser.planName === "Free") {
            return currentUser.usage?.conversions < 10;
          }

          if (currentUser.planName === "Starter") {
            return currentUser.usage?.conversions < 50;
          }

          if (currentUser.planName === "Professional") {
            return currentUser.usage?.conversions < 500;
          }

          // Enterprise or unlimited plans
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("Error checking conversion limit:", error);
      return false;
    }
  };

  const incrementConversionCount = async () => {
    if (!user) return;

    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
        }
      }
    } catch (error) {
      console.error("Error incrementing conversion count:", error);
    }
  };

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
        loading,
        checkAuthStatus, // Added this function
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};