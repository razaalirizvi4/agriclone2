require('dotenv').config();
const mongoose = require('mongoose');
const Crop = require('../api/models/cropModule/crop.model');
const connectDB = require('../serverSetup/database');

const seedCropData = async () => {
  await connectDB();

  try {
    console.log('🌾 Starting crop seed data insertion...');

    // 🧹 Clear existing crop data
    await Crop.deleteMany();
    console.log('🧹 Cleared existing crop data');

    // 🌾 Sample crop data
    const crops = [
      {
        _id: new mongoose.Types.ObjectId(),
        name: 'Wheat',
        icon: '🌾',
        seedDateRangeStart: new Date('2024-10-01'),
        seedDateRangeEnd: new Date('2024-11-15'),
        harvestDateRangeStart: new Date('2025-04-01'),
        harvestDateRangeEnd: new Date('2025-05-15'),
        tempRangeStart: '15',
        tempRangeEnd: '25',
        humidRangeStart: '40',
        humidRangeEnd: '70',
        yield: '3000-4000 kg per hectare'
      },
      {
        _id: new mongoose.Types.ObjectId(),
        name: 'Corn',
        icon: '🌽',
        seedDateRangeStart: new Date('2024-04-15'),
        seedDateRangeEnd: new Date('2024-05-31'),
        harvestDateRangeStart: new Date('2024-08-15'),
        harvestDateRangeEnd: new Date('2024-10-15'),
        tempRangeStart: '18',
        tempRangeEnd: '30',
        humidRangeStart: '50',
        humidRangeEnd: '80',
        yield: '8000-12000 kg per hectare'
      },
      {
        _id: new mongoose.Types.ObjectId(),
        name: 'Rice',
        icon: '🌾',
        seedDateRangeStart: new Date('2024-06-01'),
        seedDateRangeEnd: new Date('2024-06-30'),
        harvestDateRangeStart: new Date('2024-11-01'),
        harvestDateRangeEnd: new Date('2024-12-15'),
        tempRangeStart: '20',
        tempRangeEnd: '35',
        humidRangeStart: '70',
        humidRangeEnd: '90',
        yield: '4000-6000 kg per hectare'
      }
    ];

    // 📝 Insert crop data
    const insertedCrops = await Crop.insertMany(crops);
    console.log(`✅ Successfully inserted ${insertedCrops.length} crops!`);

    // 📊 Display inserted crops
    console.log('\n📋 Inserted crops:');
    insertedCrops.forEach((crop, index) => {
      console.log(`  ${index + 1}. ${crop.icon} ${crop.name} (ID: ${crop._id})`);
    });

    // 🔍 Verify insertion
    const totalCount = await Crop.countDocuments();
    console.log(`\n📊 Total crops in database: ${totalCount}`);

    console.log('\n🎉 Crop seed data insertion completed successfully!');
    console.log('\n📋 For MongoDB Compass:');
    console.log('🏠 Connection: mongodb://localhost:27017');
    console.log('📊 Database name: agripro');
    console.log('📋 Collection name: crops');
    console.log('💡 The crops collection has been added to your existing agripro database alongside your location and other collections.');

  } catch (error) {
    console.error('❌ Error seeding crop data:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

// Run the seed function
seedCropData();
