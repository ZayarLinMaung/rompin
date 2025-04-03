const express = require("express");
const Unit = require("../models/Unit");
const { User } = require("../models/User");
const auth = require("../middleware/auth");
const router = express.Router();
const upload = require("../middleware/upload");
const Booking = require("../models/Booking");
const fs = require("fs");

// Get all units with filters
router.get("/", auth, async (req, res) => {
  try {
    const { facing, minPrice, maxPrice, status, type, minArea, maxArea } =
      req.query;

    // Build filter object
    const filter = {};

    if (facing) {
      filter.facing = facing;
    }

    if (status) {
      filter.status = status;
    }

    if (type) {
      filter.type = type;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      filter.spaPrice = {};
      if (minPrice) filter.spaPrice.$gte = Number(minPrice);
      if (maxPrice) filter.spaPrice.$lte = Number(maxPrice);
    }

    // Area range filter
    if (minArea || maxArea) {
      filter.builtUpArea = {};
      if (minArea) filter.builtUpArea.$gte = Number(minArea);
      if (maxArea) filter.builtUpArea.$lte = Number(maxArea);
    }

    // Get units with filters
    const units = await Unit.find(filter).sort({ unitNumber: 1 });

    // Group units by facing
    const groupedUnits = {
      "Lake View": units.filter((unit) => unit.facing === "Lake View"),
      "Facility View North": units.filter(
        (unit) => unit.facing === "Facility View North"
      ),
      "Facility View East": units.filter(
        (unit) => unit.facing === "Facility View East"
      ),
      "Facility View South": units.filter(
        (unit) => unit.facing === "Facility View South"
      ),
      "Facility View West": units.filter(
        (unit) => unit.facing === "Facility View West"
      ),
    };

    res.json({
      total: units.length,
      groupedUnits,
      units, // Include flat list as well
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get unit statistics
router.get("/stats", auth, async (req, res) => {
  try {
    const stats = await Unit.aggregate([
      {
        $group: {
          _id: "$facing",
          totalUnits: { $sum: 1 },
          availableUnits: {
            $sum: { $cond: [{ $eq: ["$isAvailable", true] }, 1, 0] },
          },
          averagePrice: { $avg: "$spaPrice" },
          minPrice: { $min: "$spaPrice" },
          maxPrice: { $max: "$spaPrice" },
        },
      },
    ]);

    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get single unit
router.get("/:id", auth, async (req, res) => {
  try {
    const unit = await Unit.findById(req.params.id);
    if (!unit) {
      return res.status(404).json({ message: "Unit not found" });
    }
    res.json(unit);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Create unit (admin only)
router.post("/", auth, async (req, res) => {
  try {
    // Check if user is admin
    const user = await User.findById(req.user.id);
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const unit = new Unit(req.body);
    await unit.save();
    res.status(201).json(unit);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update unit (admin only)
router.put("/:id", auth, async (req, res) => {
  try {
    // Check if user is admin
    const user = await User.findById(req.user.id);
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    // Update unit with status field
    const unit = await Unit.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          ...req.body,
          status: req.body.status, // Ensure status is explicitly set
          isAvailable: req.body.status === "available",
        },
      },
      { new: true }
    );

    if (!unit) {
      return res.status(404).json({ message: "Unit not found" });
    }

    console.log("Updated unit:", {
      id: unit._id,
      status: unit.status,
      isAvailable: unit.isAvailable,
    });

    res.json(unit);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete unit (admin only)
router.delete("/:id", auth, async (req, res) => {
  try {
    // Check if user is admin
    const user = await User.findById(req.user.id);
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const unit = await Unit.findById(req.params.id);
    if (!unit) {
      return res.status(404).json({ message: "Unit not found" });
    }

    await unit.deleteOne();
    res.json({ message: "Unit removed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Reserve unit (user)
router.put("/:id/reserve", auth, async (req, res) => {
  try {
    const unit = await Unit.findById(req.params.id);
    if (!unit) {
      return res.status(404).json({ message: "Unit not found" });
    }

    // Check if unit is available
    if (unit.status !== "available" && req.user.role !== "admin") {
      return res.status(400).json({
        message: `Unit is not available for reservation (Status: ${unit.status})`,
      });
    }

    // Create a new booking
    const booking = new Booking({
      unitId: unit._id,
      userId: req.user.id,
      agencyName: req.body.agencyName,
      agentName: req.body.agentName,
      name: req.body.name,
      ic: req.body.ic,
      contact: req.body.contact,
      address: req.body.address,
      status: "pending",
    });

    await booking.save();

    // Update unit status to reserved
    unit.status = "reserved";
    unit.isAvailable = false;
    await unit.save();

    res.json({ booking, unit });
  } catch (err) {
    console.error("Error creating booking:", err);
    if (err.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation error",
        errors: Object.keys(err.errors).reduce((acc, key) => {
          acc[key] = err.errors[key].message;
          return acc;
        }, {}),
      });
    }
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
      // Find the most recent pending booking for this unit and user
      const booking = await Booking.findOne({
        unitId: req.params.id,
        userId: req.user.id,
        status: "pending",
      }).sort({ createdAt: -1 });

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

      // Update booking with file paths
      const updates = {};
      if (req.files.icSoftcopy) {
        updates.icSoftcopy = `uploads/${req.files.icSoftcopy[0].filename}`;
      }
      if (req.files.proofOfPayment) {
        updates.proofOfPayment = `uploads/${req.files.proofOfPayment[0].filename}`;
      }

      // Update the booking with file paths
      const updatedBooking = await Booking.findByIdAndUpdate(
        booking._id,
        { $set: updates },
        { new: true }
      );

      console.log("Updated booking:", updatedBooking);
      res.json(updatedBooking);
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
