const mongoose = require('mongoose');

const eventStreamSchema = new mongoose.Schema({
  Feature_Type: {
    type: String,
    required: true,
    //enum: ['Seeding', 'Irrigation', 'Disease', 'Fertilizer', 'Harvesting', 'Land_Prep', 'Weather']
  },
  Module_Action: {
    type: String,
    required: true,
    enum: ['Watering', 'Pesticide', 'Fungisite', 'Weedisite','API_Fetch', 'RecipeWorkflow']
  },
  Date: {
    type: Date,
    default: Date.now
  },
  State: {
    type: String,
    required: true
  },
  Meta_Data: {
    type: Object
  },
  RelationIds: {
    type: Object
  },
  RelatedUsers: [{
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    email: String,
    name: String,
    status: {
      type: String,
      enum: ['Read', 'ActionTaken', 'ActionPending'],
      default: 'ActionPending'
    }
  }]
}, {
  timestamps: true
});

const EventStream = mongoose.model('EventStream', eventStreamSchema);

module.exports = EventStream;