const express = require("express");
const bcrypt = require("bcryptjs");
const { User } = require("../models/User");
const auth = require("../middleware/auth");
const router = express.Router();

// Get all users (admin only)
router.get("/", auth, async (req, res) => {
  try {
    // Check if the requesting user is an admin
    const requestingUser = await User.findById(req.user.id);
    if (requestingUser.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update user profile
router.put("/profile", auth, async (req, res) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Update user fields
    user.name = name;
    user.email = email;

    // Update password if provided
    if (newPassword) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    await user.save();

    // Return updated user without password
    const updatedUser = await User.findById(user._id).select("-password");
    res.json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete user (admin only)
router.delete("/:id", auth, async (req, res) => {
  try {
    // Check if the requesting user is an admin
    const requestingUser = await User.findById(req.user.id);
    if (requestingUser.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const userToDelete = await User.findById(req.params.id);

    if (!userToDelete) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent deleting admin users
    if (userToDelete.role === "admin") {
      return res.status(400).json({ message: "Cannot delete admin users" });
    }

    await userToDelete.deleteOne();
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
