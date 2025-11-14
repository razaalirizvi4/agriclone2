const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  // type: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'Type', // Reference to your dynamic Type model
  //   required: true,
  // },
  type: {
    type: String,
    enum: ['Farm', 'Field', 'Building', 'Road', 'Truck'],
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
  },
  owner: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    email: String,
    name: String,
  },
  attributes: {
    type: Object,
  },

  // 🌤️ Weather information
  weather: {
    current: {
      temp: { type: String, default: '' },           // e.g. "28°C"
      humid: { type: String, default: '' },          // e.g. "70%"
      precipitation: { type: String, default: '' },  // e.g. "5mm"
      condition: { type: String, default: '' },      // e.g. "Sunny", "Cloudy"
      maxTemp: { type: String, default: '' },
      minTemp: { type: String, default: '' },
      date: { type: String, default: '' },
    },
    forecast: [
      {
        maxTemp: { type: String, default: '' },
        minTemp: { type: String, default: '' },
        date: { type: String, default: '' },
        condition: { type: String, default: '' },
      },
    ],
  },
});

module.exports = mongoose.model('Location', locationSchema);
