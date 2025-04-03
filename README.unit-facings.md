# MTerra Unit Facing Configuration Guide

This guide explains how the unit facing configuration works in MTerra and how to customize it according to your needs.

## Overview

In the MTerra Real Estate Management System, properties are categorized by their facing direction. The system supports the following facings:

- **Lake View**: Units with a view of the lake
- **Facility View North**: Units facing north toward facilities
- **Facility View South**: Units facing south toward facilities
- **Facility View East**: Units facing east toward facilities
- **Facility View West**: Units facing west toward facilities

## Default Configuration

The system has been configured to assign facings based on unit numbers:

- **Units 8-18** on all floors are designated as **Lake View**
- **Units 19-29** on all floors are designated as **Facility View North**

## How It Works

The assignment works by analyzing the unit number after the floor number (e.g., in unit "39-15", the relevant part is "15").

### Implementation Details

1. The unit number extraction logic:

```javascript
// Extract the unit number part after the floor
const unitParts = unit.unitNumber.split('-');
const unitNumberPart = unitParts.length > 1 ? unitParts[1] : unitParts[0];
      
// Try to parse the numeric part of the unit number
const numericPart = parseInt(unitNumberPart.replace(/\D/g, ''), 10);
```

2. The facing assignment logic:

```javascript
// Units 8-18 are Lake View
if (numericPart >= 8 && numericPart <= 18) {
  newFacing = 'Lake View';
} 
// Units 19-29 are Facility View North
else if (numericPart >= 19 && numericPart <= 29) {
  newFacing = 'Facility View North';
}
```

## Updating Facing Configuration

To modify the facing assignment rules:

1. Edit the facing assignment code in these files:
   - `backend/src/scripts/updateUnitFacings.js` (for updating existing units)
   - `backend/src/scripts/seedOnlyUnits.js` (for seeding only units)
   - `backend/src/scripts/seedUnits.js` (for seeding all data)

2. Update the `mapFacingToSchema` function or the unit processing logic to match your requirements.

### Example: Changing the Unit Number Ranges

If you want to change the unit ranges, modify the if-conditions:

```javascript
// Units 5-15 are Lake View
if (numericPart >= 5 && numericPart <= 15) {
  newFacing = 'Lake View';
} 
// Units 16-25 are Facility View East
else if (numericPart >= 16 && numericPart <= 25) {
  newFacing = 'Facility View East';
}
// Units 26-30 are Facility View West
else if (numericPart >= 26 && numericPart <= 30) {
  newFacing = 'Facility View West';
}
```

### Example: Adding a New Facing Type

To add a new facing type:

1. Update the Unit schema in `backend/src/models/Unit.js` to include the new facing:

```javascript
facing: {
  type: String,
  required: true,
  enum: [
    "Lake View",
    "Facility View North",
    "Facility View East",
    "Facility View South",
    "Facility View West",
    "Mountain View", // New facing type
  ],
},
```

2. Update the facing assignment logic in the scripts mentioned above.

3. Update the grouping in `backend/src/routes/units.js`:

```javascript
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
  "Mountain View": units.filter(
    (unit) => unit.facing === "Mountain View"
  ),
};
```

## Running the Update Script

After modifying the rules, run the following command to update existing units:

```bash
cd backend
npm run update-facings
```

This will:
1. Connect to the database
2. Fetch all units
3. Apply the new facing rules
4. Save the updated units

## Verification

To verify that the changes were applied correctly, you can check the database:

```bash
mongosh mterra --eval "db.units.count({facing: 'Lake View'})" | cat
mongosh mterra --eval "db.units.count({facing: 'Facility View North'})" | cat
```

## For New Installations

For new installations, the facings will be assigned when you run the seed scripts:

```bash
cd backend
npm run seed:units
```

This will create units with facings assigned according to the rules in the seed scripts. 