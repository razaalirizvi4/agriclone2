const mongoose = require("mongoose");
const Type = require("./type.model"); // adjust path if needed
const connectDB = require("../../../serverSetup/database"); // your existing DB connector

// Seed function
const seedTypes = async () => {
  await connectDB();

  try {
    // Clear existing types
    await Type.deleteMany();
    console.log("🧹 Cleared existing types");

    // Seed Farm type
    const farmType = await Type.create({
      type: "farm",
      attributes: [
        {
          key: "name",
          label: "Farm name",
          valueType: "string",
          required: true,
          inputHint: "Enter the farm name",
          example: { value: "Green valley farm" },
          modules: []
        },
        {
          key: "address",
          label: "Address",
          valueType: "string",
          required: false,
          inputHint: "Enter the physical address of the farm",
          example: { value: "123 Farm Road, City, State" },
          modules: []
        },
        {
          key: "area",
          label: "Size",
          valueType: "string",
          required: true,
          inputHint: "Enter the farm area in acres or square meters",
          example: { value: "100 acres" },
          modules: []
        },
        {
          key: "fields",
          label: "No. of fields",
          valueType: "string",
          required: false,
          inputHint: "Enter the number of fields",
          example: { value: "3 or 4" },
          modules: []
        },
        {
          key: "geometry",
          label: "Location",
          valueType: "geojson",
          required: true,
          inputHint: "Draw or enter GeoJSON for farm boundaries",
          example: { type: "Polygon", coordinates: [[[0,0],[1,0],[1,1],[0,1],[0,0]]] },
          modules: ["mapbox"]
        },
      ],
    });

    // Seed Field type
    const fieldType = await Type.create({
      type: "field",
      attributes: [
        {
          key: "cropStage",
          label: "Crop stage",
          valueType: "string",
          required: false,
          inputHint: "Enter the current growth stage (e.g., seedling, maturing)",
          example: { value: "seedling" },
          modules: []
        },
        {
          key: "name",
          label: "Field name",
          valueType: "string",
          required: true,
          inputHint: "Enter the field name",
          example: { value: "South field" },
          modules: []
        },
        {
          key: "cropType",
          label: "Crop type",
          valueType: "string",
          required: true,
          inputHint: "Select or enter the type of crop (e.g., wheat, corn)",
          example: { value: "wheat" },
          modules: []
        },
        {
          key: "soilType",
          label: "Soil type",
          valueType: "string",
          required: false,
          inputHint: "Enter the soil composition (e.g., loamy, sandy)",
          example: { value: "loamy" },
          modules: []
        },
        {
          key: "soilph",
          label: "Soil ph",
          valueType: "string",
          required: true,
          inputHint: "Select or enter the soil ph",
          example: { value: "0-14" },
          modules: []
        },
        {
          key: "geometry",
          label: "location",
          valueType: "geojson",
          required: true,
          inputHint: "Draw or enter GeoJSON for field boundaries",
          example: { type: "Polygon", coordinates: [[[0,0],[1,0],[1,1],[0,1],[0,0]]] },
          modules: ["mapbox"]
        },
      ],
    });

    console.log("✅ Types seeded successfully:", farmType.type, fieldType.type);
  } catch (err) {
    console.error("❌ Type seeding error:", err);
  } finally {
    mongoose.connection.close();
  }
};

// Run the seed
seedTypes();