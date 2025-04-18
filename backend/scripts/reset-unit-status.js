const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB using the correct environment variable
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  });

// Import the Unit model
const Unit = require('../src/models/Unit');

const resetUnits = async () => {
  try {
    console.log('Starting unit status reset...');

    // Step 1: Set all units to PRESENT status
    await Unit.updateMany({}, { status: 'PRESENT' });
    console.log('All units reset to PRESENT status');

    // Step 2: Set Landowner Units
    // Units 1-7, 38-44, 75, 76, 85, 86
    const landownerUnitNumbers = [
      ...Array.from({ length: 7 }, (_, i) => i + 1),        // 1-7
      ...Array.from({ length: 7 }, (_, i) => i + 38),       // 38-44
      75, 76, 85, 86
    ];
    
    // Format unit numbers with SL prefix and padding for single digits
    const landownerUnitStrings = landownerUnitNumbers.map(num => 
      `SL${num < 10 ? '0' + num : num}`
    );
    
    await Unit.updateMany(
      { unitNumber: { $in: landownerUnitStrings } },
      { status: 'LANDOWNER UNIT' }
    );
    
    console.log('Landowner units updated');

    // Step 3: Set Advise Units
    // Units 14, 22, 23, 25-28, 30, 33, 35, 37, 46, 48-52, 54, 55, 57, 58, 60-62, 87, 89-92, 98
    const adviseUnitNumbers = [
      14, 22, 23,
      ...Array.from({ length: 4 }, (_, i) => i + 25),   // 25-28
      30, 33, 35, 37, 46,
      ...Array.from({ length: 5 }, (_, i) => i + 48),   // 48-52
      54, 55, 57, 58,
      ...Array.from({ length: 3 }, (_, i) => i + 60),   // 60-62
      87,
      ...Array.from({ length: 4 }, (_, i) => i + 89),   // 89-92
      98
    ];
    
    // Format unit numbers with SL prefix and padding for single digits
    const adviseUnitStrings = adviseUnitNumbers.map(num => 
      `SL${num < 10 ? '0' + num : num}`
    );
    
    await Unit.updateMany(
      { unitNumber: { $in: adviseUnitStrings } },
      { status: 'ADVISE' }
    );
    
    console.log('Advise units updated');

    // Log the counts to verify
    const stats = {
      landowner: await Unit.countDocuments({ status: 'LANDOWNER UNIT' }),
      advise: await Unit.countDocuments({ status: 'ADVISE' }),
      present: await Unit.countDocuments({ status: 'PRESENT' }),
      total: await Unit.countDocuments()
    };
    console.log('Updated stats:', stats);

    console.log('Unit status reset completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error resetting unit status:', error);
    process.exit(1);
  }
};

resetUnits(); 