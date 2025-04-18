import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminDashboard from "./AdminDashboard";
import UserDashboard from "./UserDashboard";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login");
      return;
    }

    try {
      const userData = JSON.parse(storedUser);
      setUser(userData);
    } catch (error) {
      console.error("Error parsing user data:", error);
      navigate("/login");
    }
  }, [navigate]);

  if (!user) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <main className="dashboard-main">
        {user.role === "admin" ? (
          <AdminDashboard user={user} />
        ) : (
          <UserDashboard user={user} />
        )}
      </main>
    </div>
  );
};

export default Dashboard;
