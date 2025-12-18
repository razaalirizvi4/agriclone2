const express = require('express');
const router = express.Router();
const permissionController = require('../../controllers/permissionModule/permission.controller');
const  authMiddleware  = require('../../middleware/auth.middleware.js');
const permission = require('../../middleware/role.middleware.js');
// Authenticated routes - assuming we want to protect these. 
// Ideally should add auth middleware and role check (admin only for write ops).
// For now, keeping it open or minimal as per request instructions which didn't specify auth middleware details for this specifically, 
// but existing code has auth.
// I will import auth middleware if available, or just leave placeholders. 
// Existing controllers use auth middleware inside them? No, routes usually have it.
// Let's check auth.routes.js or similar for pattern. I don't have it open. 
// I'll stick to basic mapping.

router.post('/',authMiddleware, permission, permissionController.create);
router.get('/',authMiddleware, permission, permissionController.list);
router.get('/:id',authMiddleware, permission, permissionController.read);
router.put('/:id',authMiddleware, permission, permissionController.update);
router.delete('/:id',authMiddleware, permission, permissionController.remove);

module.exports = router;
