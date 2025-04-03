const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
require("dotenv").config();

// Import your models
const Unit = require("../models/Unit");
const User = require("../models/User").User;
const Booking = require("../models/Booking");

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB for seeding"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Function to read JSON data
const readJSONData = (filename) => {
  try {
    const filePath = path.join(__dirname, "..", "data", filename);
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return [];
  }
};

// Map direction to facing format required by schema
const mapFacingToSchema = (facing) => {
  // First, determine facing based on unit number
  const unitParts = facing.split('-');
  if (unitParts.length > 1) {
    // This means the "facing" is actually a unit number like "39-15"
    const unitNumberPart = unitParts[1];
    const numericPart = parseInt(unitNumberPart.replace(/\D/g, ''), 10);
    
    if (numericPart >= 8 && numericPart <= 18) {
      return 'Lake View';
    } else if (numericPart >= 19 && numericPart <= 29) {
      return 'Facility View North';
    }
  }
  
  // If we can't determine by unit number, use the legacy mapping
  const facingMap = {
    'N': 'Facility View North',
    'S': 'Facility View South',
    'E': 'Facility View East',
    'W': 'Facility View West',
    'L': 'Lake View'
  };
  return facingMap[facing] || facing;
};

// Function to seed the database with unit data
async function seedUnits() {
  try {
    // Read the room data
    const roomDataPath = path.resolve(__dirname, '../../room_data.json');
    const rawData = fs.readFileSync(roomDataPath);
    const { buildingData } = JSON.parse(rawData);
    
    // Count total units to process
    let totalUnits = 0;
    buildingData.floors.forEach(floor => {
      totalUnits += floor.units.length;
    });
    
    console.log(`Found ${totalUnits} units to process`);
    
    // Delete all existing units
    await Unit.deleteMany({});
    console.log('Cleared existing units from database');
    
    // Process each floor and its units
    let processedCount = 0;
    for (const floor of buildingData.floors) {
      for (const unit of floor.units) {
        // Map the unit data to our schema
        const unitData = {
          unitNumber: unit.unitNumber,
          lotNo: unit.lotNo,
          builtUpArea: unit.builtUpArea,
          type: unit.type,
          facing: mapFacingToSchema(unit.facing),
          spaPrice: unit.spaPrice,
          pricePerSqFt: unit.pricePerSqFt,
          totalCarParks: unit.totalCarParks,
          isAvailable: unit.isAvailable,
          status: unit.isAvailable ? 'available' : 'sold'
        };
        
        // Create the unit in the database
        await Unit.create(unitData);
        processedCount++;
        
        // Log progress every 100 units
        if (processedCount % 100 === 0 || processedCount === totalUnits) {
          console.log(`Processed ${processedCount}/${totalUnits} units`);
        }
      }
    }
    
    console.log('Database seeding completed successfully!');
    
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    // Close the database connection
    mongoose.connection.close();
  }
}

// Seed users data
const seedUsers = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});

    // Read users data from JSON file
    const usersData = readJSONData("users.json");

    // Insert users data (note: passwords should be pre-hashed in the JSON)
    if (usersData.length > 0) {
      await User.insertMany(usersData);
      console.log(`${usersData.length} users seeded successfully!`);
    }
  } catch (error) {
    console.error("Error seeding users:", error);
  }
};

// Seed bookings data
const seedBookings = async () => {
  try {
    // Clear existing data
    await Booking.deleteMany({});

    // Read bookings data from JSON file
    const bookingsData = readJSONData("bookings.json");

    // Insert bookings data
    if (bookingsData.length > 0) {
      await Booking.insertMany(bookingsData);
      console.log(`${bookingsData.length} bookings seeded successfully!`);
    }
  } catch (error) {
    console.error("Error seeding bookings:", error);
  }
};

// Run the seeding process
const seedAll = async () => {
  try {
    await seedUsers();
    await seedUnits();
    await seedBookings();

    console.log("All data seeded successfully!");
    mongoose.connection.close();
  } catch (error) {
    console.error("Error seeding data:", error);
    mongoose.connection.close();
  }
};

seedAll();
