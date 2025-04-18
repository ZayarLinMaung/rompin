import React from "react";
import { Navigate, useLocation } from "react-router-dom";

const PrivateRoute = ({ children, adminOnly = false }) => {
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");
  const location = useLocation();

  console.log("PrivateRoute - Token:", token); // Debug log
  console.log("PrivateRoute - User:", userStr); // Debug log
  console.log("PrivateRoute - Path:", location.pathname); // Debug log

  if (!token || !userStr) {
    // Not authenticated
    return <Navigate to="/login" state={{ from: location }} />;
  }

  try {
    const user = JSON.parse(userStr);
    
    // Check for admin access if required
    if (adminOnly && user.role !== "admin") {
      console.log("Access denied - Not an admin"); // Debug log
      return <Navigate to="/" />;
    }

    // Authenticated and authorized
    return children;
  } catch (error) {
    console.error("Error parsing user data:", error);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return <Navigate to="/login" state={{ from: location }} />;
  }
};

export default PrivateRoute;
