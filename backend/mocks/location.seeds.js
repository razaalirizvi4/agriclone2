require("dotenv").config();
const mongoose = require("mongoose");
const Location = require("../api/models/locationModule/location.model");
const connectDB = require("../serverSetup/database");
const User = require("../api/models/userModule/user.model");
const Crop = require("../api/models/cropModule/crop.model");

const seedData = async () => {
  await connectDB();

  try {
    // 🧹 Clear existing data
    await Location.deleteMany();

    // 👤 Get real user from DB
    const user = await User.findOne();
    if (!user) {
      console.error("❌ No user found in DB. Please create one first.");
      return mongoose.connection.close();
    }

    // 🌾 Get crops from DB
    const crops = await Crop.find();
    if (crops.length === 0) {
      console.error("❌ No crops found! Run crop.seed.js first.");
      return mongoose.connection.close();
    }

    // 🌾 Create a farm
    const farm = await Location.create({
      type: "Farm",
      name: "Green Valley Farm",
      owner: {
        id: user._id,
        email: user.email,
        name: user.name,
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

    // 🌱 Create two fields under the farm
    const field1 = await Location.create({
      type: "Field",
      name: "North Field",
      parentId: farm._id,
      owner: {
        id: user._id,
        email: user.email,
        name: user.name,
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
      name: "South Field",
      parentId: farm._id,
      owner: {
        id: user._id,
        email: user.email,
        name: user.name,
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

    console.log("✅ Seed Data Inserted Successfully!");
    console.log({ farm, field1, field2 });
  } catch (error) {
    console.error("❌ Error seeding data:", error);
  } finally {
    mongoose.connection.close();
  }
};

seedData();