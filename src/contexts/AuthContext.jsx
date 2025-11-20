import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);
const API_URL = import.meta.env.VITE_API_URL;
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  if (!context) throw new Error('useAuth must be used within AuthProvider');
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
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('pdfpro_user');
      
      if (token && storedUser) {
        try {
          // Verify token is still valid by making API call
          const response = await fetch(`${API_URL}/api/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const userInfo = await response.json();
            if (userInfo.success) {
              setUser(userInfo.user);
            } else {
              throw new Error('Token invalid');
            }
          } else {
            throw new Error('Token validation failed');
          }
        } catch (error) {
          console.error('Token validation failed:', error);
          logout();
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
      logout();
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
    localStorage.setItem('pdfpro_user', JSON.stringify(fullUser));
    localStorage.setItem('token', token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('pdfpro_user');
    localStorage.removeItem('token');
  };

  const updateUser = (updatedData) => {
    const updatedUser = { ...user, ...updatedData };
    setUser(updatedUser);
    localStorage.setItem('pdfpro_user', JSON.stringify(updatedUser));
  };

  const updateUserPlan = (newPlanData) => {
    const updatedUser = { 
      ...user, 
      plan: newPlanData.plan,
      planName: newPlanData.planName,
      billingCycle: newPlanData.billingCycle,
      subscriptionStatus: newPlanData.subscriptionStatus,
      planExpiry: newPlanData.planExpiry
    };
    setUser(updatedUser);
    localStorage.setItem('pdfpro_user', JSON.stringify(updatedUser));
  };

  const getToken = () => {
    return localStorage.getItem('token');
  };

  // Check if user can perform conversion based on plan limits
  const canPerformConversion = async () => {
    if (!user) return false;

    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userInfo = await response.json();
        if (userInfo.success) {
          const currentUser = userInfo.user;
          
          // Update local user state
          setUser(currentUser);
          localStorage.setItem('pdfpro_user', JSON.stringify(currentUser));

          // Check conversion limits
          if (currentUser.planName === 'Free') {
            return currentUser.usage.conversions < 10; // Free plan limit
          }
          
          if (currentUser.planName === 'Starter') {
            return currentUser.usage.conversions < 50; // Starter plan limit
          }
          
          if (currentUser.planName === 'Professional') {
            return currentUser.usage.conversions < 500; // Professional plan limit
          }
          
          // Enterprise or unlimited plans
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error checking conversion limit:', error);
      return false;
    }
  };

  // Increment conversion count
  const incrementConversionCount = async () => {
    if (!user) return;

    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userInfo = await response.json();
        if (userInfo.success) {
          const updatedUser = {
            ...userInfo.user,
            usage: {
              ...userInfo.user.usage,
              conversions: userInfo.user.usage.conversions + 1
            }
          };
          
          setUser(updatedUser);
          localStorage.setItem('pdfpro_user', JSON.stringify(updatedUser));
        }
      }
    } catch (error) {
      console.error('Error incrementing conversion count:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loginBackend, 
      logout, 
      updateUser,
      updateUserPlan,
      getToken,
      canPerformConversion,
      incrementConversionCount,
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};