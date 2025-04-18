// Connect to the database
db = db.getSiblingDB('rompin');

// First, set all units to EMPTY (available)
db.units.updateMany({}, { $set: { status: "EMPTY" } });

// Update landowner units
const landownerUnits = [
  "SL01", "SL02", "SL03", "SL04", "SL05", "SL06", "SL07",
  "SL38", "SL39", "SL40", "SL41", "SL42", "SL43", "SL44",
  "SL75", "SL76", "SL85", "SL86"
];

db.units.updateMany(
  { unitNumber: { $in: landownerUnits } },
  { $set: { status: "LANDOWNER UNIT" } }
);

// Update advise units
const adviseUnits = [
  "SL14", "SL22", "SL23", "SL24", "SL25", "SL26", "SL27", "SL28", "SL29", "SL30",
  "SL33", "SL35", "SL36", "SL37", "SL46", "SL48", "SL49", "SL50", "SL51", "SL52",
  "SL57", "SL58", "SL60", "SL61", "SL62", "SL87", "SL89", "SL90", "SL91", "SL92", "SL98"
];

db.units.updateMany(
  { unitNumber: { $in: adviseUnits } },
  { $set: { status: "ADVISE" } }
);

// Print results to verify
print("Current unit status counts:");
print(db.units.aggregate([
  { $group: { _id: "$status", count: { $sum: 1 } } }
]).toArray()); 