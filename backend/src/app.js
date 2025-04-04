const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
const domainHandler = require("./middleware/domainHandler");
require("dotenv").config();

const app = express();

// Domain handling middleware
app.use(domainHandler);

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_DOMAINS ? 
    process.env.ALLOWED_DOMAINS.split(',').map(domain => `https://${domain}`) : 
    '*',
  credentials: true
};
app.use(cors(corsOptions));

// Middleware
app.use(express.json());

// Serve static files from the uploads directory
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Routes
app.use("/api/users", require("./routes/users"));
app.use("/api/units", require("./routes/units"));
app.use("/api/bookings", require("./routes/bookings"));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

module.exports = app;
