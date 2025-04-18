const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Unit Schema
const unitSchema = new mongoose.Schema({
  unitNumber: {
    type: String,
    required: true,
    unique: true
  },
  phase: {
    type: String,
    enum: ['TERES FASA 1', 'TERES FASA 2', 'SEMI-D'],
    required: true
  },
  status: {
    type: String,
    enum: ['ADVISE', 'PRESENT', 'LA SIGNED', 'SPA SIGNED', 'LOAN APPROVED', 
           'PENDING BUYER DOC', 'LANDOWNER UNIT', 'NEW BOOK', 'LOAN IN PROCESS', 'EMPTY'],
    default: 'EMPTY'
  },
  specifications: {
    landArea: String,
    builtUp: String,
    bedrooms: Number,
    bathrooms: Number,
    price: Number
  }
});

const Unit = mongoose.model('Unit', unitSchema);

// Unit specifications data
const unitSpecs = {
  'TERES FASA 1': {
    landArea: '20\' x 70\'',
    builtUp: '1,400 sq.ft',
    bedrooms: 3,
    bathrooms: 2,
    price: 299000
  },
  'TERES FASA 2': {
    landArea: '20\' x 70\'',
    builtUp: '1,400 sq.ft',
    bedrooms: 3,
    bathrooms: 2,
    price: 309000
  },
  'SEMI-D': {
    landArea: '40\' x 80\'',
    builtUp: '2,200 sq.ft',
    bedrooms: 4,
    bathrooms: 3,
    price: 499000
  }
};

// Function to determine unit phase
const getPhase = (unitNumber) => {
  const num = parseInt(unitNumber.replace('SL', ''));
  if (num >= 1 && num <= 37) return 'TERES FASA 1';
  if (num >= 38 && num <= 74) return 'TERES FASA 2';
  return 'SEMI-D';
};

// Function to determine initial status
const getInitialStatus = (unitNumber) => {
  return 'PRESENT';  // Set all units as PRESENT
};

async function seedUnits() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rompin');
    console.log('Connected to MongoDB');

    // Clear existing units
    await Unit.deleteMany({});
    console.log('Cleared existing units');

    // Create units
    const units = [];
    for (let i = 1; i <= 98; i++) {
      const unitNumber = `SL${i.toString().padStart(2, '0')}`;
      const phase = getPhase(unitNumber);
      const status = getInitialStatus(unitNumber);
      
      units.push({
        unitNumber,
        phase,
        status,
        specifications: unitSpecs[phase]
      });
    }

    // Insert all units
    await Unit.insertMany(units);
    console.log('Successfully seeded units');

    // Print summary
    const summary = await Unit.aggregate([
      {
        $group: {
          _id: '$phase',
          count: { $sum: 1 },
          available: {
            $sum: {
              $cond: [{ $eq: ['$status', 'PRESENT'] }, 1, 0]
            }
          }
        }
      }
    ]);

    console.log('\nUnit Summary:');
    summary.forEach(phase => {
      console.log(`${phase._id}:`);
      console.log(`  Total Units: ${phase.count}`);
      console.log(`  Available Units: ${phase.available}`);
      console.log(`  Price: RM${unitSpecs[phase._id].price.toLocaleString()}`);
    });

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

seedUnits(); 