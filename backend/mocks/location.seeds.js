require("dotenv").config();
const mongoose = require("mongoose");
const Location = require("../api/models/locationModule/location.model");
const connectDB = require("../serverSetup/database");
const User = require("../api/models/userModule/user.model");
const Crop = require("../api/models/cropModule/crop.model");
// const Events = require('../api/models/eventStream/eventStream.model')

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
                [71.64160189965244, 31.722087042293893],
                [71.64160189965244, 31.70038220255566],
                [71.6926322381434, 31.70038220255566],
                [71.6926322381434, 31.722087042293893],
                [71.64160189965244, 31.722087042293893]
              ]]
            }
          }
        ]
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
                [71.64329040125813, 31.721147139837967],
                [71.64329040125813, 31.70153614037976],
                [71.66613032562233, 31.70153614037976],
                [71.66613032562233, 31.721147139837967],
                [71.64329040125813, 31.721147139837967]
              ]]
            }
          }
        ]
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
                [71.66676968491757, 31.72096559415469],
                [71.66676968491757, 31.70171776135676],
                [71.69196016659328, 31.70171776135676],
                [71.69196016659328, 31.72096559415469],
                [71.66676968491757, 31.72096559415469]
              ]]
            }
          }
        ]
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