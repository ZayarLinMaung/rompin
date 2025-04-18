const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  try {
    // Get token from header
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json({ message: "No token provided. Please log in again." });
    }

    // Verify token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // Add user from payload
      req.user = decoded;
      next();
    } catch (verifyError) {
      if (verifyError.name === 'TokenExpiredError') {
        return res
          .status(401)
          .json({ message: "Session expired. Please log in again." });
      }
      return res
        .status(401)
        .json({ message: "Invalid token. Please log in again." });
    }
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ message: "Authentication error" });
  }
};

module.exports = auth;
