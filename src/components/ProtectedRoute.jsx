import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>; // Optional: show spinner while checking auth

  if (!user) {
    // Not logged in → redirect to login page
    return <Navigate to="/login" replace />;
  }

  return children; // Logged in → show protected content
};

export default ProtectedRoute;
