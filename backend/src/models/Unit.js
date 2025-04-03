const mongoose = require("mongoose");

const unitSchema = new mongoose.Schema({
  unitNumber: {
    type: String,
    required: true,
    unique: true,
  },
  lotNo: {
    type: String,
    required: true,
    unique: true,
  },
  builtUpArea: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ["B1", "B", "C1", "C"],
  },
  facing: {
    type: String,
    required: true,
    enum: [
      "Lake View",
      "Facility View North",
      "Facility View East",
      "Facility View South",
      "Facility View West",
    ],
  },
  spaPrice: {
    type: Number,
    required: true,
  },
  pricePerSqFt: {
    type: Number,
    required: true,
  },
  totalCarParks: {
    type: Number,
    required: true,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  status: {
    type: String,
    enum: ["available", "reserved", "booked", "sold", "pending"],
    default: "available",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt timestamp before saving
unitSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Unit", unitSchema);
