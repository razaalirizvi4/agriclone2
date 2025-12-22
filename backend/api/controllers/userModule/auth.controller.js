const User = require('../../models/userModule/user.model');
const UserRole = require('../../models/userModule/userRole.model');
const jwt = require('jsonwebtoken');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  res.status(403).json({ message: 'Public registration is disabled. Please contact an administrator.' });
};

// @desc    Authenticate user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  console.log('Login Controller called');
  const { email, password } = req.body;

  // Check for user email
  const user = await User.findOne({ email }).populate('roleId').populate('permissions');

  if (user && (await user.comparePassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
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
