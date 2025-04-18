const express = require("express");
const Booking = require("../models/Booking");
const Unit = require("../models/Unit");
const { User } = require("../models/User");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const fs = require("fs");
const router = express.Router();

// Get all bookings (admin sees all, users see only their own)
router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    let bookings;

    if (user.role === "admin") {
      bookings = await Booking.find()
        .populate("userId", "name email")
        .populate("unitId", "unitNumber type builtUpArea spaPrice");
    } else {
      bookings = await Booking.find({ userId: req.user.id }).populate(
        "unitId",
        "unitNumber type builtUpArea spaPrice"
      );
    }

    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get user's bookings
router.get("/user", auth, async (req, res) => {
  try {
    console.log("Fetching bookings for user:", req.user.id);

    const bookings = await Booking.find({ userId: req.user.id })
      .populate("unitId")
      .sort({ createdAt: -1 });

    console.log("Found bookings:", bookings);

    if (!bookings || bookings.length === 0) {
      console.log("No bookings found for user");
    }

    res.json(bookings);
  } catch (err) {
    console.error("Error fetching user bookings:", err);
    console.error("Error details:", {
      name: err.name,
      message: err.message,
      stack: err.stack,
    });
    res.status(500).json({ message: "Server error" });
  }
});

// Get single booking
router.get("/:id", auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("userId", "name email")
      .populate("unitId", "unitNumber type builtUpArea spaPrice");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check if user is admin or booking owner
    const user = await User.findById(req.user.id);
    if (user.role !== "admin" && booking.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Create booking
router.post("/", auth, async (req, res) => {
  try {
    const unit = await Unit.findById(req.body.unitId);
    if (!unit) {
      return res.status(404).json({ message: "Unit not found" });
    }

    if (!unit.isAvailable) {
      return res
        .status(400)
        .json({ message: "Unit is not available for booking" });
    }

    const booking = new Booking({
      userId: req.user.id,
      unitId: req.body.unitId,
      type: req.body.type,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      notes: req.body.notes,
      status: "pending",
    });

    // Update unit availability
    unit.isAvailable = false;
    await unit.save();

    await booking.save();

    // Populate the unit details before sending response
    await booking.populate("unitId", "unitNumber type builtUpArea spaPrice");

    res.status(201).json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update booking status (admin only)
router.put("/:id/status", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const unit = await Unit.findById(booking.unitId);
    if (!unit) {
      return res.status(404).json({ message: "Unit not found" });
    }

    // If status is being changed to approved, automatically set it to booked
    const newStatus =
      req.body.status === "approved" ? "booked" : req.body.status;
    booking.status = newStatus;

    // Update unit status based on booking status
    if (newStatus === "cancelled" || newStatus === "rejected") {
      unit.status = "PRESENT";
      unit.isAvailable = true;
    } else if (newStatus === "booked") {
      unit.status = "NEW BOOK";
      unit.isAvailable = false;
    } else if (newStatus === "pending") {
      unit.status = "ADVISE";
      unit.isAvailable = false;
    }

    console.log("Updating status:", {
      bookingId: booking._id,
      oldStatus: booking.status,
      newStatus: newStatus,
      unitId: unit._id,
      unitStatus: unit.status,
      isAvailable: unit.isAvailable
    });

    // Save both booking and unit
    await Promise.all([booking.save(), unit.save()]);

    // Populate the response with all necessary fields
    await booking.populate([
      {
        path: "unitId",
        select: "unitNumber type builtUpArea spaPrice status isAvailable"
      },
      {
        path: "userId",
        select: "name email"
      }
    ]);

    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Cancel booking
router.put("/:id/cancel", auth, async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({
        message: "Only pending reservations can be cancelled",
      });
    }

    // Update booking status
    booking.status = "cancelled";
    await booking.save();

    // Update unit status and availability
    const unit = await Unit.findById(booking.unitId);
    if (unit) {
      unit.status = "PRESENT";
      unit.isAvailable = true;
      await unit.save();
    }

    // Populate the response with unit details
    await booking.populate([
      {
        path: "unitId",
        select: "unitNumber type builtUpArea spaPrice status isAvailable"
      },
      {
        path: "userId",
        select: "name email"
      }
    ]);

    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Handle file uploads for a booking
router.post(
  "/:id/files",
  auth,
  upload.fields([
    { name: "icSoftcopy", maxCount: 1 },
    { name: "proofOfPayment", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const booking = await Booking.findById(req.params.id);
      if (!booking) {
        // Clean up uploaded files if booking not found
        if (req.files) {
          Object.values(req.files).forEach((files) => {
            files.forEach((file) => {
              fs.unlinkSync(file.path);
            });
          });
        }
        return res.status(404).json({ message: "Booking not found" });
      }

      console.log("Found booking:", booking);
      console.log("Uploaded files:", req.files);

      // Update booking with file paths (without leading slash)
      if (req.files.icSoftcopy) {
        booking.icSoftcopy = `uploads/${req.files.icSoftcopy[0].filename}`;
      }
      if (req.files.proofOfPayment) {
        booking.proofOfPayment = `uploads/${req.files.proofOfPayment[0].filename}`;
      }

      console.log("Updating booking with paths:", {
        icSoftcopy: booking.icSoftcopy,
        proofOfPayment: booking.proofOfPayment,
      });

      await booking.save();

      // Populate the response
      await booking.populate("unitId", "unitNumber type builtUpArea spaPrice");

      res.json(booking);
    } catch (err) {
      console.error("Error uploading files:", err);
      // Clean up uploaded files on error
      if (req.files) {
        Object.values(req.files).forEach((files) => {
          files.forEach((file) => {
            fs.unlinkSync(file.path);
          });
        });
      }
      res.status(500).json({ message: "Error uploading files" });
    }
  }
);

module.exports = router;
