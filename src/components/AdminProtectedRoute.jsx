// File: src/components/AdminProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";

const AdminProtectedRoute = ({ children }) => {
  const admin = JSON.parse(localStorage.getItem("pdfpro_admin"));

  if (!admin) {
    // Not logged in as admin → redirect to admin login
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default AdminProtectedRoute;
