require("dotenv").config();
const mongoose = require("mongoose");
const EventStream = require("../api/models/eventStream/eventStream.model");
const connectDB = require("../serverSetup/database");
const Location = require("../api/models/locationModule/location.model");

const seedData = async () => {
  await connectDB();

  try {
    // 🧹 Clear existing EventStream data
    await EventStream.deleteMany();

    const field1 = await Location.findOne({ name: "West Field" });
    const field2 = await Location.findOne({ name: "East Field" });

    // 📅 Events according to your schema
    const events = [
      {
        Feature_Type: "Seeding",
        Module_Action: "API_Fetch",
        Date: new Date("2025-10-01"),
        State: "Completed",
        Meta_Data: {
          icon: "https://cdn-icons-png.flaticon.com/512/3074/3074366.png",
          details:
            "Planted the new batch of wheat seeds for the spring season.",
          color: "#4CAF50",
          name: "Seeding",
          crop: "Wheat",
          area: "6 acres",
          method: "Seed Drill",
          equipmentUsed: "Seeder X200",
        },
        RelationIds: {
          Field_id: field2._id,
        },
      },
      {
        Feature_Type: "Fertilizer",
        Module_Action: "API_Fetch",
        Date: new Date("2025-10-07"),
        State: "Completed",
        Meta_Data: {
          icon: "https://cdn-icons-png.flaticon.com/512/3067/3067822.png",
          details:
            "Applied high-nitrogen fertilizer (Urea) to North and West Fields. Monitor soil absorption.",
          color: "#2196F3",
          name: "Nutrient Application",
          fertilizerType: "Urea",
          quantity: "40kg",
          method: "Broadcast",
        },
        RelationIds: {
          Field_id: field2._id,
        },
      },
      {
        Feature_Type: "Irrigation",
        Module_Action: "Watering",
        Date: new Date("2025-10-10"),
        State: "Completed",
        Meta_Data: {
          icon: "https://cdn-icons-png.flaticon.com/512/2809/2809618.png",
          details: "Completed the first irrigation cycle for the new crops.",
          color: "#17a2b8",
          name: "Irrigation",
          crop: "Corn",
          duration: "4 hours",
          waterSource: "Well-3",
          method: "Drip Irrigation",
        },
        RelationIds: {
          Field_id: field2._id,
        },
      },
      {
        Feature_Type: "Disease",
        Module_Action: "Pesticide",
        Date: new Date("2025-10-30"),
        State: "Pending",
        Meta_Data: {
          icon: "https://cdn-icons-png.flaticon.com/512/619/619089.png",
          details:
            "Bi-weekly scouting will be completed. Organic insecticide will be applied to the South Field to manage aphids.",
          color: "#dc3545",
          name: "Pest Control",
          disease: "Rust Infection",
          pesticideUsed: "RustGuard 250ml",
          severity: "Medium",
        },
        RelationIds: {
          Field_id: field2._id,
        },
      },
      {
        Feature_Type: "Harvesting",
        Module_Action: "Weedisite",
        Date: new Date("2025-05-15"),
        State: "Pending",
        Meta_Data: {
          icon: "https://cdn-icons-png.flaticon.com/512/476/476127.png",
          details:
            "The first batch of wheat will be harvested. The yield is expected to be above average.",
          color: "#ffc107",
          name: "Harvesting",
          yield: "3.5 tons",
          weather: "Sunny",
          machine: "Combine Harvester H350",
        },
        RelationIds: {
          Field_id: field2._id,
        },
      },
      {
        Feature_Type: "Land_Prep",
        Module_Action: "API_Fetch",
        Date: new Date("2025-01-01"),
        State: "Completed",
        Meta_Data: {
          icon: "https://cdn-icons-png.flaticon.com/512/815/815273.png",
          details:
            "Field plowed and leveled to prepare for next crop rotation. Soil moisture levels checked.",
          color: "#795548",
          name: "Land Preparation",
          equipmentUsed: "Rotavator T100",
          depth: "12 inches",
        },
        RelationIds: {
          Field_id: field1._id,
        },
      },
      {
        Feature_Type: "Seeding",
        Module_Action: "API_Fetch",
        Date: new Date("2025-06-01"),
        State: "Completed",
        Meta_Data: {
          icon: "https://cdn-icons-png.flaticon.com/512/3074/3074366.png",
          details:
            "Planted the new batch of wheat seeds for the spring season.",
          color: "#4CAF50",
          name: "Seeding",
          crop: "Wheat",
          area: "6 acres",
          method: "Seed Drill",
          equipmentUsed: "Seeder X200",
        },
        RelationIds: {
          Field_id: field1._id,
        },
      },
      {
        Feature_Type: "Fertilizer",
        Module_Action: "API_Fetch",
        Date: new Date("2025-10-05"),
        State: "Completed",
        Meta_Data: {
          icon: "https://cdn-icons-png.flaticon.com/512/3067/3067822.png",
          details:
            "Applied potassium-based fertilizer to enhance flowering and yield potential.",
          color: "#2196F3",
          name: "Fertilization Round 2",
          fertilizerType: "Potash",
          quantity: "35kg",
          method: "Top Dressing",
        },
        RelationIds: {
          Field_id: field1._id,
        },
      },
      {
        Feature_Type: "Irrigation",
        Module_Action: "Watering",
        Date: new Date("2025-10-10"),
        State: "Completed",
        Meta_Data: {
          icon: "https://cdn-icons-png.flaticon.com/512/2809/2809618.png",
          details:
            "Second irrigation round completed to maintain soil moisture before flowering stage.",
          color: "#17a2b8",
          name: "Irrigation Cycle 2",
          crop: "Maize",
          duration: "3 hours",
          waterSource: "Canal",
          method: "Sprinkler",
        },
        RelationIds: {
          Field_id: field1._id,
        },
      },
      {
        Feature_Type: "Disease",
        Module_Action: "Pesticide",
        Date: new Date("2025-11-25"),
        State: "Pending",
        Meta_Data: {
          icon: "https://cdn-icons-png.flaticon.com/512/619/619075.png",
          details:
            "Applied herbicide to manage weed growth before the crop reached maturity.",
          color: "#8BC34A",
          name: "Weed Control",
          herbicideUsed: "WeedClear 1L",
          method: "Spray",
          duration: "2 hours",
        },
        RelationIds: {
          Field_id: field1._id,
        },
      },
      {
        Feature_Type: "Harvesting",
        Module_Action: "Weedisite",
        Date: new Date("2025-12-15"),
        State: "Pending",
        Meta_Data: {
          icon: "https://cdn-icons-png.flaticon.com/512/476/476127.png",
          details:
            "The harvest will be completed successfully. Grain moisture will remain within the optimal range.",
          color: "#FFC107",
          name: "Harvesting",
          yield: "4.1 tons",
          weather: "Clear",
          machine: "Harvester Pro H500",
        },
        RelationIds: {
          Field_id: field1._id,
        },
      },
    ];

    // 💾 Insert mock data
    await EventStream.insertMany(events);
    console.log(
      "✅ EventStream seeded successfully with unified owner & field!"
    );
  } catch (error) {
    console.error("❌ Error seeding EventStream data:", error);
  } finally {
    mongoose.connection.close();
  }
};

seedData();
