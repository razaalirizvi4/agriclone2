const express = require('express');
const ctrl = require('../../controllers/cropModule/crop.controller');
const authMiddleware = require('../../middleware/auth.middleware.js');
const router = express.Router();
const permissionCheck = require('../../middleware/permission.middleware');

router.post('/', authMiddleware, permissionCheck('create', 'crops'), ctrl.create);
router.get('/', authMiddleware, permissionCheck('view', 'crops'), ctrl.list);
router.get('/:id', authMiddleware, permissionCheck('view', 'crops'), ctrl.getById);
router.put('/:id', authMiddleware, permissionCheck('update', 'crops'), ctrl.updateById);
router.delete('/:id', authMiddleware, permissionCheck('delete', 'crops'), ctrl.deleteById);

module.exports = router;
