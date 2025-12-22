const User = require('../models/userModule/user.model');
const mongoose = require('mongoose');
/**
 * Permission-based Access Middleware
 *
 * This middleware checks if the logged-in user is an admin or owner based on isAdmin flag.
 * - Admin (isAdmin: true): Can see all farms and fields (no filter)
 * - Owner (isAdmin: false): Can only see farms and fields where owner.id matches their user_id
 *
 * Attaches to req:
 * - req.userRole: The full user object with populated permissions
 * - req.accessFilter: MongoDB filter object for querying locations
 * - req.isAdmin: Boolean indicating if user is admin (based on isAdmin flag)
 * - req.isOwner: Boolean indicating if user is owner (not admin)
 */
module.exports = async function permissionAccess(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }
    // Get user with populated permissions
    const user = await User.findById(req.user._id)
      .populate({
        path: 'roleId',
        populate: { path: 'permissions', model: 'Permission' },
      });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    // Use isAdmin to determine access level
    req.isAdmin = user.isAdmin;
    req.isOwner = !req.isAdmin;
    req.userRole = user;
    
    // Admin sees everything; Owner only their own
    if (req.isAdmin) {
      // Admin can see all locations (no filter)
      req.accessFilter = {};
    } else {
      // Owner can only see locations where owner.id matches their user_id
      req.accessFilter = { 'owner.id': user._id };
    }
    next();
  } catch (err) {
    res.status(500).json({ message: 'Permission access check failed.', error: err.message });
  }
};