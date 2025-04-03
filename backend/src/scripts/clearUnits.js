import mongoose from "mongoose";
import Unit from "../models/Unit.js";
import dotenv from "dotenv";

dotenv.config();

const clearUnits = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/mterra"
    );
    console.log("Connected to MongoDB");

    // Clear all units
    const result = await Unit.deleteMany({});
    console.log(
      `Successfully removed ${result.deletedCount} units from the database`
    );

    // Close the connection
    await mongoose.connection.close();
    console.log("Database connection closed");
  } catch (error) {
    console.error("Error clearing units:", error);
    await mongoose.connection.close();
  }
};

clearUnits();
