const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  action: {
    type: String,
    required: true,
    trim: true,
  },
  module: {
    type: String,
    required: true,
    trim: true,
  },
});

const Permission = mongoose.model('Permission', permissionSchema);

module.exports = Permission;
