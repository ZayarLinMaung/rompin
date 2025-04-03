const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

// Function to create admin user
async function createAdminUser() {
  try {
    const adminExists = await User.findOne({ email: "admin@mterra.com" });
    if (!adminExists) {
      await User.create({
        email: "admin@mterra.com",
        password: "admin123456",
        name: "Admin User",
        role: "admin",
      });
      console.log("Admin user created successfully");
    }
  } catch (error) {
    console.error("Error creating admin user:", error);
  }
}

module.exports = {
  User,
  createAdminUser,
};
