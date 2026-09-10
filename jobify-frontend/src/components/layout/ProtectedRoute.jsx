import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../shared/LoadingSpinner";

const ProtectedRoute = ({ role, children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner message="Verifying security credentials..." />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Admin has access to everything, or check if role matches
  if (role) {
    const allowedRoles = Array.isArray(role) ? role : [role];
    if (!allowedRoles.includes(user.role) && user.role !== "admin") {
      // Redirect to their respective dashboard
      const target =
        user.role === "employer"
          ? "/employer"
          : user.role === "institute"
          ? "/institute"
          : user.role === "admin"
          ? "/admin"
          : "/trainee";
      return <Navigate to={target} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
