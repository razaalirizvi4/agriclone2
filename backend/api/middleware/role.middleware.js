const User = require('../models/userModule/user.model');
const UserRole = require('../models/userModule/userRole.model');
/**
 * Role-based Access Middleware
 *
 * This middleware checks if the logged-in user is an admin or owner.
 * - Admin: Can see all farms and fields (no filter)
 * - Owner: Can only see farms and fields where owner.id matches their user_id
 *
 * Attaches to req:
 * - req.role: The role name (e.g., 'Admin', 'Owner')
 * - req.userRole: The full user object with populated role
 * - req.accessFilter: MongoDB filter object for querying locations
 * - req.isAdmin: Boolean indicating if user is admin
 * - req.isOwner: Boolean indicating if user is owner
 */
module.exports = async function roleAccess(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }
    // Ensure role populated
    const user = await User.findById(req.user._id).populate('roleId');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    const roleName = user.roleId?.role || '';
    const roleNameLower = roleName.toLowerCase();
    // Attach role information to request
    req.role = roleName;
    req.userRole = user;
    req.isAdmin = roleNameLower === 'admin';
    req.isOwner = roleNameLower === 'owner';
    // Admin sees everything; Owner only their own
    if (req.isAdmin) {
      // Admin can see all locations (no filter)
      req.accessFilter = {};
    } else if (req.isOwner) {
      // Owner can only see locations where owner.id matches their user_id
      req.accessFilter = { 'owner.id': user._id };
    } else {
      // Default to restrictive for unknown roles (treat as owner)
      req.accessFilter = { 'owner.id': user._id };
      req.isOwner = true;
    }
    next();
  } catch (err) {
    res.status(500).json({ message: 'Role access check failed.', error: err.message });
  }
};