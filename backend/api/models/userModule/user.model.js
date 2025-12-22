const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  hashPassword: {
    type: String,
    required: true,
  },
  roleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserRole',
    required: true,
  },
  // permissions: [
  //   {
  //     type: mongoose.Schema.Types.ObjectId,
  //     ref: 'Permission',
  //   },
  // ],
  contact: {
    type: String,
    trim: true,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  active: {
    type: Boolean,
    default: true,
  },
  isRemoved: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('hashPassword')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.hashPassword = await bcrypt.hash(this.hashPassword, salt);
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.hashPassword);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
