const User = require('../../models/userModule/user.model');
const UserRole = require('../../models/userModule/userRole.model');
const Permission = require('../../models/permissionModule/permission.model');

// @desc    Create a new user (Admin only)
// @route   POST /api/users
// @access  Private/Admin
const createUser = async (req, res) => {
  try {
    console.log('createUser called with body:', req.body);
    const { name, email, password, contact, roleId, permissions } = req.body;

    // Validation
    if (!name || !email || !password || !roleId) {
      return res.status(400).json({ message: 'Please provide name, email, password, and roleId.' });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists.' });
    }

    // Find the Role
    let userRole = await UserRole.findOne({ roleId: roleId });
    if (!userRole) {
        if (roleId.match(/^[0-9a-fA-F]{24}$/)) {
            userRole = await UserRole.findById(roleId);
        }
    }

    if (!userRole) {
      return res.status(400).json({ message: 'Invalid role specified.' });
    }

    let assignedPermissions = userRole.permissions;
    if (permissions && Array.isArray(permissions) && permissions.length > 0) {
        assignedPermissions = permissions; 
    }

    const isAdmin = (userRole.roleId === 'admin');

    const user = await User.create({
      name,
      email,
      hashPassword: password,
      roleId: userRole._id,
      permissions: assignedPermissions,
      isAdmin,
      contact,
    });

    console.log('User created:', user._id);
    res.status(201).json(user);
  } catch (error) {
    console.error('createUser Error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    console.log('getUsers called');
    const users = await User.find({})
      .populate('roleId', 'role roleId')
      .populate('permissions', 'name action module')
      .select('-hashPassword'); 
    console.log(`Found ${users.length} users`);
    res.json(users);
  } catch (error) {
    console.error('getUsers Error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
  try {
    const { name, email, contact, roleId, permissions, password } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.contact = contact || user.contact;

    if (password) {
        user.hashPassword = password; 
    }

    if (roleId) {
       let userRole = await UserRole.findOne({ roleId: roleId });
       if (!userRole && roleId.match(/^[0-9a-fA-F]{24}$/)) {
            userRole = await UserRole.findById(roleId);
       }
       if (userRole) {
           user.roleId = userRole._id;
           if (!permissions) {
               user.permissions = userRole.permissions;
           }
           user.isAdmin = (userRole.roleId === 'admin');
       }
    }

    if (permissions) {
        user.permissions = permissions;
    }

    const updatedUser = await user.save();
    
    const populatedUser = await User.findById(updatedUser._id)
        .populate('roleId', 'role roleId')
        .populate('permissions', 'name action module')
        .select('-hashPassword');

    res.json(populatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.deleteOne();
    res.json({ message: 'User removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  createUser,
  getUsers,
  updateUser,
  deleteUser,
};
