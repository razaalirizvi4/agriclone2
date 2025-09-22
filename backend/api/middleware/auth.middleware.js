const jwt = require('jsonwebtoken');
const User = require('../models/userModule/user.model');

const CheckAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decodedToken.userId).select('-hashPassword');

    if (!user) {
      throw new Error('Authentication failed: User not found.');
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Authentication failed!', error: error.message });
  }
};

module.exports = CheckAuth;
