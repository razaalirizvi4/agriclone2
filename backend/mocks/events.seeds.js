require('dotenv').config();
const mongoose = require('mongoose');
const EventStream = require('../api/models/eventStream/eventStream.model');
const connectDB = require('../serverSetup/database');
const Location = require('../api/models/locationModule/location.model')

const seedData = async () => {
  await connectDB();

  try {
    // 🧹 Clear existing EventStream data
    await EventStream.deleteMany();

    const field1 = await Location.findOne({ name: 'North Field' });
    const field2 = await Location.findOne({ name: 'South Field' });

    // 📅 Events according to your schema
    const events = [
      {
        Feature_Type: 'Seeding',
        Module_Action: 'API_Fetch',
        Date: new Date('2023-01-15'),
        State: 'Completed',
        Meta_Data: {
          icon: 'https://cdn-icons-png.flaticon.com/512/3074/3074366.png',
          details: 'Planted the new batch of wheat seeds for the spring season.',
          color: '#4CAF50',
          name: 'Seeding',
          crop: 'Wheat',
          area: '6 acres',
          method: 'Seed Drill',
          equipmentUsed: 'Seeder X200',
        },
        // RelationIds: [field1._id],
        RelationIds:{
          "Field_id": field1._id,
        }
  
      },
      {
        Feature_Type: 'Fertilizer',
        Module_Action: 'API_Fetch',
        Date: new Date('2024-03-20'),
        State: 'Completed',
        Meta_Data: {
          icon: 'https://cdn-icons-png.flaticon.com/512/3067/3067822.png',
          details: 'Applied high-nitrogen fertilizer (Urea) to North and West Fields. Monitor soil absorption.',
          color: '#2196F3',
          name: 'Nutrient Application',
          fertilizerType: 'Urea',
          quantity: '40kg',
          method: 'Broadcast',
        },
        RelationIds: null,
        
      },
      {
        Feature_Type: 'Irrigation',
        Module_Action: 'Watering',
        Date: new Date('2023-02-20'),
        State: 'Completed',
        Meta_Data: {
          icon: 'https://cdn-icons-png.flaticon.com/512/2809/2809618.png',
          details: 'Completed the first irrigation cycle for the new crops.',
          color: '#17a2b8',
          name: 'Irrigation',
          crop: 'Corn',
          duration: '4 hours',
          waterSource: 'Well-3',
          method: 'Drip Irrigation',
        },
        RelationIds:{
          "Field_id": field2._id,
        }
        
      },
      {
        Feature_Type: 'Disease',
        Module_Action: 'Pesticide',
        Date: new Date('2024-04-05'),
        State: 'Completed',
        Meta_Data: {
          icon: 'https://cdn-icons-png.flaticon.com/512/619/619089.png',
          details: 'Bi-weekly scouting completed. Applied organic insecticide to South Field to manage aphids.',
          color: '#dc3545',
          name: 'Pest Control',
          disease: 'Rust Infection',
          pesticideUsed: 'RustGuard 250ml',
          severity: 'Medium',
        },
        RelationIds: null,
       
      },
      {
        Feature_Type: 'Harvesting',
        Module_Action: 'Weedisite',
        Date: new Date('2023-06-10'),
        State: 'Completed',
        Meta_Data: {
          icon: 'https://cdn-icons-png.flaticon.com/512/476/476127.png',
          details: 'Harvested the first batch of wheat. Yield was above average.',
          color: '#ffc107',
          name: 'Harvesting',
          yield: '3.5 tons',
          weather: 'Sunny',
          machine: 'Combine Harvester H350',
        },
        RelationIds: null,
        
      },
    ];

    // 💾 Insert mock data
    await EventStream.insertMany(events);
    console.log('✅ EventStream seeded successfully with unified owner & field!');
  } catch (error) {
    console.error('❌ Error seeding EventStream data:', error);
  } finally {
    mongoose.connection.close();
  }
};

seedData();
