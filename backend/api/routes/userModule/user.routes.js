const express = require('express');
const router = express.Router();
const {
  createUser,
  getUsers,
  updateUser,
  deleteUser,
} = require('../../controllers/userModule/user.controller');
const CheckAuth = require('../../middleware/auth.middleware');
const permissionCheck = require('../../middleware/permission.middleware');

router.use(CheckAuth); 

// Create User: Requires 'create' 'users' permission
router.post('/', permissionCheck('create', 'users'), createUser);

// Get Users: Requires 'view' 'users' (Global) or we might need to handle 'view' 'own_users'
// For now, restricting to 'view' 'users' which Admin has.
router.get('/', permissionCheck('view', 'users'), getUsers);

// Update/Delete:
router.put('/:id', permissionCheck('update', 'users'), updateUser);
router.delete('/:id', permissionCheck('delete', 'users'), deleteUser);

module.exports = router;
