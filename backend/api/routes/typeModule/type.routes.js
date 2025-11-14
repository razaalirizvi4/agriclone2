const express = require('express');
const router = express.Router();
const typeController = require('../../controllers/typeModule/type.controller');
const authMiddleware = require('../../middleware/auth.middleware.js');
const permission = require('../../middleware/role.middleware.js');

// Apply authentication and authorization middleware to each route
router.post('/', authMiddleware, permission, typeController.createTypeController);
router.get('/', authMiddleware, permission, typeController.getTypesController);
router.get('/:id', authMiddleware, permission, typeController.getTypeByIdController);
router.put('/:id', authMiddleware, permission, typeController.updateTypeController);
router.delete('/:id', authMiddleware, permission, typeController.deleteTypeController);

module.exports = router;
