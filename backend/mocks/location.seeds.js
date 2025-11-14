require("dotenv").config();
const mongoose = require("mongoose");
const Location = require("../api/models/locationModule/location.model");
const connectDB = require("../serverSetup/database");
const User = require("../api/models/userModule/user.model");
const Crop = require("../api/models/cropModule/crop.model");

const seedCropData = require("./crops.seed"); // crop seeder
const seedEventData = require("./events.seeds"); // event seeder
const seedData = async () => {
  await connectDB();

  try {
  // 🌾 Seed crops if none exist
  if (await Crop.countDocuments() === 0) {
    console.log("🌱 No crops found — seeding crops first...");
    await seedCropData();
    await connectDB(); // reconnect after seed
  }

  // 🧹 Reset locations
  await Location.deleteMany();

  // 👤 Get specific owner users (John Doe and Jane Smith)
  const user1 = await User.findOne({ email: 'john.doe@example.com' });
  const user2 = await User.findOne({ email: 'jane.smith@example.com' });
  
  if (!user1 || !user2) {
    console.error("❌ John Doe or Jane Smith not found. Please run user.seeds.js first.");
    return mongoose.connection.close();
  }
  
  console.log(`✅ Found user1: ${user1.name} (${user1.email})`);
  console.log(`✅ Found user2: ${user2.name} (${user2.email})`);

  // 🌾 Get all crops after possible seeding
  const crops = await Crop.find();

    // 🌾 Create first farm (owned by user1)
    const farm = await Location.create({
      type: "Farm",
      name: "Green Valley Farm",
      owner: {
        id: user1._id,
        email: user1.email,
        name: user1.name,
      },
      attributes: {
        area: "15 acres",
        lat: 71.64160189965244,
        lon: 31.722087042293893,
        geoJsonCords: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: {},
              geometry: {
                type: "Polygon",
                coordinates: [[
                  [73.24515425583573, 30.659805811703293],
                  [73.24514204121277, 30.65712645308942],
                  [73.24856213550791, 30.657115945654795],
                  [73.24856213550791, 30.6598373331272],
                  [73.245157023844, 30.659812590820877],]
                ],
              },
            },
          ],
        },
        crop_id: null,
        lifecycle: "Active",
      },
      weather: {
        current: {
          temp: "28°C",
          humid: "65%",
          precipitation: "2mm",
          maxTemp: "30°C",
          minTemp: "22°C",
          date: "2025-10-10",
          condition: "Sunny",
        },
        forecast: [
          {
            maxTemp: "30°C",
            minTemp: "22°C",
            date: "2025-10-11",
            condition: "Cloudy",
          },
          {
            maxTemp: "29°C",
            minTemp: "21°C",
            date: "2025-10-12",
            condition: "Partly Cloudy",
          },
          {
            maxTemp: "27°C",
            minTemp: "20°C",
            date: "2025-10-13",
            condition: "Rainy",
          },
        ],
      },
    });

    // 🌱 Create two fields under the first farm
    const field1 = await Location.create({
      type: "Field",
      name: "West Field",
      parentId: farm._id,
      owner: {
        id: user1._id,
        email: user1.email,
        name: user1.name,
      },
      attributes: {
        area: "6 acres",
        geoJsonCords: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: {},
              geometry: {
                type: "Polygon",
                coordinates: [[
                  [73.24545020768969, 30.659218868235],
                  [73.24545020768969, 30.658184633083152],
                  [73.24517189949643, 30.6581654804758],
                  [73.24516076716964, 30.65762920593393],
                  [73.24646324950987, 30.65762920593393],
                  [73.24646324950987, 30.659218868235],
                  [73.24546134001781, 30.659218868235],]
                ],
              },
            },
          ],
        },
        crop_id: crops.find((c) => c.name === "Wheat")._id,
        lifecycle: "Seeding",
      },
      weather: {
        current: {
          temp: "27°C",
          humid: "70%",
          precipitation: "1mm",
          maxTemp: "29°C",
          minTemp: "20°C",
          date: "2025-10-10",
          condition: "Cloudy",
        },
        forecast: [
          {
            maxTemp: "29°C",
            minTemp: "20°C",
            date: "2025-10-11",
            condition: "Sunny",
          },
          {
            maxTemp: "28°C",
            minTemp: "19°C",
            date: "2025-10-12",
            condition: "Rainy",
          },
          {
            maxTemp: "26°C",
            minTemp: "18°C",
            date: "2025-10-13",
            condition: "Partly Cloudy",
          },
        ],
      },
    });

    const field2 = await Location.create({
      type: "Field",
      name: "East Field",
      parentId: farm._id,
      owner: {
        id: user1._id,
        email: user1.email,
        name: user1.name,
      },
      attributes: {
        area: "9 acres",
        geoJsonCords: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: {},
              geometry: {
                type: "Polygon",
                coordinates: [[
                  [73.24720911546487, 30.659218868235],
                  [73.24719798313814, 30.65809844632068],
                  [73.24788818745523, 30.658060141068688],
                  [73.24788818745523, 30.659218868235],
                  [73.247220247793, 30.659247596831136],]
                ],
              },
            },
          ],
        },
        crop_id: crops.find((c) => c.name === "Rice")._id,
        lifecycle: "Growing",
      },
      weather: {
        current: {
          temp: "29°C",
          humid: "60%",
          precipitation: "0mm",
          maxTemp: "31°C",
          minTemp: "23°C",
          date: "2025-10-10",
          condition: "Sunny",
        },
        forecast: [
          {
            maxTemp: "31°C",
            minTemp: "23°C",
            date: "2025-10-11",
            condition: "Clear",
          },
          {
            maxTemp: "30°C",
            minTemp: "22°C",
            date: "2025-10-12",
            condition: "Sunny",
          },
          {
            maxTemp: "28°C",
            minTemp: "21°C",
            date: "2025-10-13",
            condition: "Cloudy",
          },
        ],
      },
    });

    // 🌾 Create second farm (owned by user2) with one field
    const farm2 = await Location.create({
      type: "Farm",
      name: "Sunset Ridge Farm",
      owner: {
        id: user2._id,
        email: user2.email,
        name: user2.name,
      },
      attributes: {
        area: "20 acres",
        lat: 72.64160189965244,
        lon: 32.722087042293893,
        geoJsonCords: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: {},
              geometry: {
                type: "Polygon",
                coordinates: [[
                  [74.24515425583573, 31.659805811703293],
                  [74.24514204121277, 31.65712645308942],
                  [74.24856213550791, 31.657115945654795],
                  [74.24856213550791, 31.6598373331272],
                  [74.245157023844, 31.659812590820877],]
                ],
              },
            },
          ],
        },
        crop_id: null,
        lifecycle: "Active",
      },
      weather: {
        current: {
          temp: "26°C",
          humid: "68%",
          precipitation: "3mm",
          maxTemp: "28°C",
          minTemp: "20°C",
          date: "2025-10-10",
          condition: "Partly Cloudy",
        },
        forecast: [
          {
            maxTemp: "28°C",
            minTemp: "20°C",
            date: "2025-10-11",
            condition: "Sunny",
          },
          {
            maxTemp: "27°C",
            minTemp: "19°C",
            date: "2025-10-12",
            condition: "Cloudy",
          },
          {
            maxTemp: "25°C",
            minTemp: "18°C",
            date: "2025-10-13",
            condition: "Rainy",
          },
        ],
      },
    });

    // 🌱 Create one field under the second farm
    const field3 = await Location.create({
      type: "Field",
      name: "North Field",
      parentId: farm2._id,
      owner: {
        id: user2._id,
        email: user2.email,
        name: user2.name,
      },
      attributes: {
        area: "12 acres",
        geoJsonCords: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: {},
              geometry: {
                type: "Polygon",
                coordinates: [[
                  [74.24545020768969, 31.659218868235],
                  [74.24545020768969, 31.658184633083152],
                  [74.24517189949643, 31.6581654804758],
                  [74.24516076716964, 31.65762920593393],
                  [74.24646324950987, 31.65762920593393],
                  [74.24646324950987, 31.659218868235],
                  [74.24546134001781, 31.659218868235],]
                ],
              },
            },
          ],
        },
        crop_id: crops.find((c) => c.name === "Corn")?._id || crops[0]._id,
        lifecycle: "Growing",
      },
      weather: {
        current: {
          temp: "25°C",
          humid: "72%",
          precipitation: "2mm",
          maxTemp: "27°C",
          minTemp: "19°C",
          date: "2025-10-10",
          condition: "Cloudy",
        },
        forecast: [
          {
            maxTemp: "27°C",
            minTemp: "19°C",
            date: "2025-10-11",
            condition: "Sunny",
          },
          {
            maxTemp: "26°C",
            minTemp: "18°C",
            date: "2025-10-12",
            condition: "Partly Cloudy",
          },
          {
            maxTemp: "24°C",
            minTemp: "17°C",
            date: "2025-10-13",
            condition: "Rainy",
          },
        ],
      },
    });

    console.log("✅ Locations seeded successfully!");

    // 🌾 Finally: Seed Events (after locations done)
    console.log("📅 Seeding events now...");
    await seedEventData();
  } catch (error) {
    console.error("❌ Error seeding data:", error);
  } finally {
    mongoose.connection.close();
  }
};

seedData();