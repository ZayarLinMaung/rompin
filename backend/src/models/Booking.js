const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    unitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled", "booked"],
      default: "pending",
    },
    agencyName: {
      type: String,
      required: true,
    },
    agentName: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    ic: {
      type: String,
      required: true,
    },
    contact: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    proofOfPayment: {
      type: String,
    },
    icSoftcopy: {
      type: String,
    },
  },
  { timestamps: true }
);

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = Booking;
