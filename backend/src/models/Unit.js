const mongoose = require("mongoose");

const unitSchema = new mongoose.Schema({
  unitNumber: {
    type: String,
    required: true,
    unique: true,
  },
  specifications: {
    builtUp: {
      type: String,
      default: "20'x40'"
    },
    extraLand: {
      type: String,
      default: "8'"
    },
    landSize: {
      type: String,
      default: "20'x70'"
    },
    bedrooms: {
      type: Number,
      default: 3
    },
    bathrooms: {
      type: Number,
      default: 2
    }
  },
  status: {
    type: String,
    enum: ["PRESENT", "ADVISE", "LA SIGNED", "SPA SIGNED", "LOAN APPROVED", 
           "PENDING BUYER DOC", "LANDOWNER UNIT", "NEW BOOK", "LOAN IN PROCESS"],
    default: "PRESENT"
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

// Update the updatedAt timestamp before saving
unitSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Unit", unitSchema);
