const User = require('../../models/userModule/user.model');
const UserRole = require('../../models/userModule/userRole.model');
const jwt = require('jsonwebtoken');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { name, email, password, contact, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please enter all required fields' });
  }

  // Check if user exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ message: 'User already exists' });
  }

  // Choose role (admin|owner), default to owner
  const desiredRoleId = (role || 'owner').toLowerCase() === 'admin' ? 'admin' : 'owner';
  let selectedRole = await UserRole.findOne({ roleId: desiredRoleId });
  if (!selectedRole) {
    // Fallback: create if missing (ensureRoles should have created already)
    selectedRole = await UserRole.create({ role: desiredRoleId === 'admin' ? 'Admin' : 'Owner', roleId: desiredRoleId, permissions: [] });
  }

  // Create user
  const user = await User.create({
    name,
    email,
    hashPassword: password, // The pre-save hook in the model will hash this
    roleId: selectedRole._id,
    permissions: [], // Will be populated from role later if needed
    contact,
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: selectedRole.role,
      token: generateToken(user._id),
    });
  } else {
    res.status(400).json({ message: 'Invalid user data' });
  }
};

// @desc    Authenticate user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  console.log('Login Controller called');
  const { email, password } = req.body;

  // Check for user email
  const user = await User.findOne({ email }).populate('roleId');

  if (user && (await user.comparePassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.roleId.role,
      token: generateToken(user._id),
    });
  } else {
    res.status(400).json({ message: 'Invalid credentials' });
  }
};

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ userId: id }, process.env.JWT_SECRET, { expiresIn: '10h' });
};

module.exports = {
  registerUser,
  loginUser,
};
