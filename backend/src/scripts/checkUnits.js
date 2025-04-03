import mongoose from "mongoose";
import Unit from "../models/Unit.js";
import dotenv from "dotenv";

dotenv.config();

const checkUnits = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/mterra"
    );
    console.log("Connected to MongoDB");

    // Get all units
    const units = await Unit.find({});
    console.log(`Found ${units.length} units in the database:`);
    console.log(JSON.stringify(units, null, 2));

    // Close the connection
    await mongoose.connection.close();
    console.log("Database connection closed");
  } catch (error) {
    console.error("Error checking units:", error);
    await mongoose.connection.close();
  }
};

checkUnits();
