const User = require('../models/userModule/user.model');

const permissionCheck = (action, module) => async (req, res, next) => {
  try {
    // Assuming req.user is populated by an authentication middleware
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const user = await User.findById(req.user._id).populate({
      path: 'roleId',
      populate: {
        path: 'permissions',
        model: 'Permission',
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Extract permissions from the user's role
    const userPermissions = user.roleId.permissions;

    // Check if the user has the required permission
    const hasPermission = (user.roleId.role === 'Admin') || userPermissions.some(
      (perm) => perm.action === action && perm.module === module
    );

    if (hasPermission) {
      next();
    } else {
      res.status(403).json({ message: 'Forbidden: You do not have the required permission.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Permission check failed.', error: error.message });
  }
};

module.exports = permissionCheck;
