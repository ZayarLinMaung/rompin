const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Unit = require('../models/Unit');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Function to update unit facings based on unit numbers
async function updateUnitFacings() {
  try {
    console.log('Starting unit facing update process...');
    
    // Get all units
    const units = await Unit.find({});
    console.log(`Found ${units.length} units to process`);
    
    let lakeViewCount = 0;
    let facilityViewCount = 0;
    
    // Process each unit
    for (const unit of units) {
      // Extract the unit number part after the floor
      const unitParts = unit.unitNumber.split('-');
      const unitNumberPart = unitParts.length > 1 ? unitParts[1] : unitParts[0];
      
      // Try to parse the numeric part of the unit number
      const numericPart = parseInt(unitNumberPart.replace(/\D/g, ''), 10);
      
      let newFacing;
      
      // Units 8-18 are Lake View
      if (numericPart >= 8 && numericPart <= 18) {
        newFacing = 'Lake View';
        lakeViewCount++;
      } 
      // Units 19-29 are Facility View North (default)
      else if (numericPart >= 19 && numericPart <= 29) {
        newFacing = 'Facility View North';
        facilityViewCount++;
      }
      // Keep existing facing for any other unit numbers
      else {
        console.log(`Skipping unit ${unit.unitNumber} with number part ${numericPart}`);
        continue;
      }
      
      // Update the unit if facing has changed
      if (unit.facing !== newFacing) {
        console.log(`Updating unit ${unit.unitNumber}: ${unit.facing} -> ${newFacing}`);
        unit.facing = newFacing;
        await unit.save();
      }
    }
    
    console.log('Unit facing update completed!');
    console.log(`Updated ${lakeViewCount} units to Lake View`);
    console.log(`Updated ${facilityViewCount} units to Facility View North`);
    
  } catch (error) {
    console.error('Error updating unit facings:', error);
  } finally {
    // Close the database connection
    mongoose.connection.close();
  }
}

// Run the update function
updateUnitFacings(); 