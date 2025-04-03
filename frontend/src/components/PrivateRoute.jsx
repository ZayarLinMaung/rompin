import React from "react";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");

  console.log("PrivateRoute - Token:", token); // Debug log
  console.log("PrivateRoute - User:", user); // Debug log

  if (!token || !user) {
    // Not authenticated
    return <Navigate to="/login" />;
  }

  // Authenticated
  return children;
};

export default PrivateRoute;
