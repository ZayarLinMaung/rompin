import React, { useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

const Login = ({ setUser }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('Attempting login with:', { email: formData.email });
      
      // First, test if the server is reachable
      try {
        const testResponse = await axios.get('http://localhost:5000/api/test');
        console.log('Backend server is reachable:', testResponse.data);
      } catch (testError) {
        console.error('Backend server test failed:', testError);
        throw new Error('Unable to connect to the server. Please make sure it is running.');
      }

      // Proceed with login
      const response = await axios({
        method: 'post',
        url: 'http://localhost:5000/api/auth/login',
        data: formData,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log("Login response:", response.data);

      if (!response.data.token) {
        throw new Error('No token received from server');
      }

      // Store token and user data
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      // Update user state in App component
      setUser(response.data.user);

      console.log("Stored user data:", response.data.user);

      // Route based on user role
      if (response.data.user.role === 'admin') {
        navigate('/admin');
      } else {
        // Get the redirect URL from query parameters or default to home
        const params = new URLSearchParams(location.search);
        const redirectUrl = params.get('redirect') || '/';
        navigate(redirectUrl);
      }
    } catch (err) {
      console.error("Login error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        headers: err.response?.headers,
        config: err.config
      });

      if (err.response?.status === 400) {
        setError(err.response.data.message || "Invalid credentials");
      } else if (err.response?.status === 401) {
        setError("Unauthorized. Please check your credentials.");
      } else if (err.response?.status === 403) {
        setError("Access forbidden. Please contact support.");
      } else if (err.message.includes('Network Error')) {
        setError("Unable to connect to the server. Please try again later.");
      } else {
        setError(
          err.response?.data?.message || 
          err.message || 
          "Failed to login. Please check your credentials and try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="form-container">
        <h1 className="form-title">Welcome Back</h1>
        <p className="form-subtitle">Sign in to your account</p>

        {error && (
          <div className="error-message">
            <span className="error-text">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-input"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? (
              <>
                <svg className="spinner" viewBox="0 0 24 24">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                </svg>
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1rem" }}>
          <p className="helper-text">
            Don't have an account?{" "}
            <a href="/register" className="form-link">
              Sign up here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
