import fs from "fs";
import path from "path";

// Read the JSON file
const filePath = path.join(process.cwd(), "src/data/room_data.json");
console.log(`Reading file from: ${filePath}`);

try {
  const roomData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  console.log(`File read successfully`);

  // Get all unique floor numbers and sort them
  const allFloors = [
    ...new Set(roomData.buildingData.floors.map((f) => f.floorNumber)),
  ];
  allFloors.sort((a, b) => b - a); // Sort in descending order

  // Keep all floors from 39 down to 4
  const filteredFloors = allFloors.filter((floor) => floor <= 39 && floor >= 4);
  console.log(
    `Found ${filteredFloors.length} unique floors: ${filteredFloors.join(", ")}`
  );

  // Process each floor
  filteredFloors.forEach((floorNumber) => {
    // Get all units for this floor
    const floorData = roomData.buildingData.floors.filter(
      (f) => f.floorNumber === floorNumber
    );
    const allUnitsForFloor = floorData.flatMap((f) => f.units);

    console.log(`\nFloor ${floorNumber} has ${allUnitsForFloor.length} units:`);

    // Track processed units to avoid duplicates
    const processedUnits = new Set();

    allUnitsForFloor.forEach((unit) => {
      const unitNumber = `${floorNumber}-${unit.unitNumber}`;

      // Skip if we've already processed this unit
      if (processedUnits.has(unitNumber)) {
        return;
      }
      processedUnits.add(unitNumber);

      // Map facing direction
      let facing;
      switch (unit.facing) {
        case "S":
          facing = "Facility View South";
          break;
        case "N":
          facing = "Facility View North";
          break;
        case "E":
          facing = "Facility View East";
          break;
        case "W":
          facing = "Facility View West";
          break;
        case "L":
          facing = "Lake View";
          break;
        default:
          facing = "Facility View South";
      }

      // Display unit information
      console.log(`
        Unit Number: ${unitNumber}
        Lot Number: ${floorNumber}-${unit.lotNo}
        Type: ${unit.type}
        Built-up Area: ${unit.builtUpArea} sq ft
        Facing: ${facing}
        SPA Price: ${unit.spaPrice}
        Price per Sq Ft: ${unit.pricePerSqFt}
        Total Car Parks: ${unit.totalCarParks}
        Status: ${unit.isAvailable ? "Available" : "Not Available"}
        ------------------------`);
    });
  });
} catch (error) {
  console.error("Error reading JSON file:", error);
  process.exit(1);
}
