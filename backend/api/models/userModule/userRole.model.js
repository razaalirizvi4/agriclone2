const mongoose = require('mongoose');

const userRoleSchema = new mongoose.Schema({
  role: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  roleId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  permissions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Permission',
    },
  ],
});

const UserRole = mongoose.model('UserRole', userRoleSchema);

module.exports = UserRole;
