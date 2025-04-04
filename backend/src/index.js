const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const { User, createAdminUser } = require("./models/User");
const unitsRoutes = require("./routes/units");
const bookingsRoutes = require("./routes/bookings");

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// MongoDB Connection with better error handling and options
console.log("Attempting to connect to MongoDB...");
console.log(
  "MongoDB URI:",
  process.env.MONGODB_URI || "mongodb://localhost:27017/rompin"
);

mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/rompin", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  })
  .then(async () => {
    console.log("Connected to MongoDB successfully");
    console.log(
      "Database URI:",
      process.env.MONGODB_URI || "mongodb://localhost:27017/rompin"
    );

    // Test the connection by listing collections
    mongoose.connection.db.listCollections().toArray((err, collections) => {
      if (err) {
        console.error("Error listing collections:", err);
      } else {
        console.log(
          "Available collections:",
          collections.map((c) => c.name)
        );
      }
    });

    // Create admin user if it doesn't exist
    await createAdminUser();
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    console.error("Connection details:", {
      uri: process.env.MONGODB_URI || "mongodb://localhost:27017/rompin",
      error: err.message,
      code: err.code,
      name: err.name,
    });
    // Don't exit the process, let it retry
    // process.exit(1);
  });

// Add mongoose connection error handler
mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected");
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Global error handler caught:", err);
  console.error("Error stack:", err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/units", unitsRoutes);
app.use("/api/bookings", bookingsRoutes);

// Test route
app.get("/api/test", (req, res) => {
  res.json({
    message: "Backend is working!",
    mongodb: {
      state: mongoose.connection.readyState,
      stateName:
        mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    },
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});
