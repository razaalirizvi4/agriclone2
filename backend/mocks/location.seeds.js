require('dotenv').config();
const mongoose = require('mongoose');
const Location = require('../api/models/locationModule/location.model');
const connectDB = require('../serverSetup/database');

const seedData = async () => {
  await connectDB();

  try {
    // mock two crops

    // mock locations, pass crops to it for crop Id.

    // mock event stream , pass location for field ids in relations


    // 🧹 Clear existing data
    await Location.deleteMany();

    // 👤 Mock user
    const user = {
      id: new mongoose.Types.ObjectId(),
      email: 'farmer@example.com',
      name: 'Abdullah Khan',
    };

    // 🌾 Create a farm
    const farm = await Location.create({
      type: 'Farm',
      name: 'Green Valley Farm',
      owner: user,
      attributes: {
        area: '15 acres',
        geoJsonCords: [73.0479, 33.6844],
        crop_id: null,
        lifecycle: 'Active',
      },
    });

    // 🌱 Field 1
    const field1 = await Location.create({
      type: 'Field',
      name: 'North Field',
      parentId: farm._id,
      owner: user,
      attributes: {
        area: '6 acres',
        geoJsonCords: [73.0495, 33.6850],
        crop_id: 'WHT-001',
        lifecycle: 'Seeding',
      },
      weather: {
        current: {
          temp: '27°C',
          humid: '70%',
          precipitation: '1mm',
          maxTemp: '29°C',
          minTemp: '20°C',
          date: '2025-10-10',
          condition: 'Cloudy',
        },
        forecast: [
          { maxTemp: '29°C', minTemp: '20°C', date: '2025-10-11', condition: 'Sunny' },
          { maxTemp: '28°C', minTemp: '19°C', date: '2025-10-12', condition: 'Rainy' },
          { maxTemp: '26°C', minTemp: '18°C', date: '2025-10-13', condition: 'Partly Cloudy' },
        ],
      },
    });

    // 🌽 Field 2
    const field2 = await Location.create({
      type: 'Field',
      name: 'South Field',
      parentId: farm._id,
      owner: user,
      attributes: {
        area: '9 acres',
        geoJsonCords: [73.0460, 33.6830],
        crop_id: 'CRN-002',
        lifecycle: 'Growing',
      },
      weather: {
        current: {
          temp: '29°C',
          humid: '60%',
          precipitation: '0mm',
          maxTemp: '31°C',
          minTemp: '23°C',
          date: '2025-10-10',
          condition: 'Sunny',
        },
        forecast: [
          { maxTemp: '31°C', minTemp: '23°C', date: '2025-10-11', condition: 'Clear' },
          { maxTemp: '30°C', minTemp: '22°C', date: '2025-10-12', condition: 'Sunny' },
          { maxTemp: '28°C', minTemp: '21°C', date: '2025-10-13', condition: 'Cloudy' },
        ],
      },
    });

    console.log('✅ Seed Data Inserted Successfully!');
    console.log({ farm, field1, field2 });
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    mongoose.connection.close();
  }
};

seedData();
