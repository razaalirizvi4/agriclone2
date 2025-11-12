const User = require('../models/userModule/user.model');

const permission = (allowedRoles) => async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const user = await User.findById(req.user._id).populate('roleId');

    if (!user || !user.roleId) {
      return res.status(403).json({ message: 'Forbidden: User role not found.' });
    }

    const userRole = user.roleId.role.toLowerCase();

    if (allowedRoles.map(role => role.toLowerCase()).includes(userRole)) {
      next();
    } else {
      res.status(403).json({ message: 'Forbidden: You do not have the required permission.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Permission check failed.', error: error.message });
  }
};

module.exports = permission;