import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import UserDashboard from "./components/UserDashboard";
import AdminDashboard from "./components/AdminDashboard";
import PrivateRoute from "./components/PrivateRoute";
import UnitTypes from './components/UnitTypes';

const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
  },
});

function App() {
  const [user, setUser] = useState(null);

  // Function to update user state
  const updateUserState = () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing user data:', error);
        setUser(null);
      }
    } else {
      setUser(null);
    }
  };

  // Initial load of user data
  useEffect(() => {
    updateUserState();
  }, []);

  // Listen for storage events (for cross-tab synchronization)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'user' || e.key === 'token') {
        updateUserState();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Create a context provider value
  const userContextValue = {
    user,
    setUser: (newUser) => {
      if (newUser) {
        localStorage.setItem('user', JSON.stringify(newUser));
      } else {
        localStorage.removeItem('user');
      }
      setUser(newUser);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <div className="min-h-screen bg-gray-100">
          <Routes>
            <Route path="/login" element={<Login setUser={userContextValue.setUser} />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<UserDashboard user={user} setUser={userContextValue.setUser} />} />
            <Route
              path="/admin"
              element={
                <PrivateRoute adminOnly={true}>
                  <AdminDashboard user={user} setUser={userContextValue.setUser} />
                </PrivateRoute>
              }
            />
            <Route
              path="/unit-types"
              element={<UnitTypes />}
            />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
