const User = require('../../models/userModule/user.model');
const UserRole = require('../../models/userModule/userRole.model');
const jwt = require('jsonwebtoken');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { name, email, password, contact } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please enter all required fields' });
  }

  // Check if user exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ message: 'User already exists' });
  }

  // Find the 'Farmer' role. If not found, create it.
  let farmerRole = await UserRole.findOne({ role: 'Farmer' });
  if (!farmerRole) {
    farmerRole = await UserRole.create({
      role: 'Farmer',
      roleId: 'farmer', // A simple ID for the farmer role
      permissions: [], // Farmers might have no special permissions initially
    });
  }

  // Create user
  const user = await User.create({
    name,
    email,
    hashPassword: password, // The pre-save hook in the model will hash this
    roleId: farmerRole._id,
    permissions: [], // Will be populated from role later if needed
    contact,
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: farmerRole.role,
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
  return jwt.sign({ userId: id }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

module.exports = {
  registerUser,
  loginUser,
};
