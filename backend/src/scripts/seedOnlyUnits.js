const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
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
    
    // Ask for confirmation before clearing the database
    console.log('This will delete all existing units in the database.');
    console.log('Press Ctrl+C to cancel or wait 5 seconds to continue...');
    
    // Wait for 5 seconds
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Delete all existing units
    await Unit.deleteMany({});
    console.log('Cleared existing units from database');
    
    // Process each floor and its units
    let processedCount = 0;
    const processedUnits = new Set(); // Track processed unit identifiers
    const processedLots = new Set(); // Track processed lot numbers
    
    for (const floor of buildingData.floors) {
      for (const unit of floor.units) {
        // Create unique identifiers
        const uniqueUnitNumber = `${floor.floorNumber}-${unit.unitNumber}`;
        const uniqueLotNo = `F${floor.floorNumber}-${unit.lotNo}`;
        
        // Skip if we've already processed this unit number
        if (processedUnits.has(uniqueUnitNumber)) {
          console.log(`Skipping duplicate unit: ${uniqueUnitNumber}`);
          continue;
        }
        
        // Add to processed sets
        processedUnits.add(uniqueUnitNumber);
        processedLots.add(uniqueLotNo);
        
        // Map the unit data to our schema
        const unitData = {
          unitNumber: uniqueUnitNumber,
          lotNo: uniqueLotNo,
          builtUpArea: unit.builtUpArea,
          type: unit.type,
          facing: mapFacingToSchema(unit.facing),
          spaPrice: unit.spaPrice,
          pricePerSqFt: unit.pricePerSqFt,
          totalCarParks: unit.totalCarParks,
          isAvailable: unit.isAvailable,
          status: unit.isAvailable ? 'available' : 'sold'
        };
        
        try {
          // Create the unit in the database
          await Unit.create(unitData);
          processedCount++;
          
          // Log progress periodically
          if (processedCount % 100 === 0 || processedCount === totalUnits) {
            console.log(`Processed ${processedCount} units`);
          }
        } catch (err) {
          console.error(`Error creating unit ${uniqueUnitNumber}:`, err.message);
        }
      }
    }
    
    console.log(`Database seeding completed! ${processedCount} units added.`);
    
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    // Close the database connection
    mongoose.connection.close();
  }
}

// Run the seed function
seedUnits(); 