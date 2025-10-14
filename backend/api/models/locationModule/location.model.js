
const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
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
});

module.exports = mongoose.model('Location', locationSchema);
