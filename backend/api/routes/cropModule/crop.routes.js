const express = require('express');
const ctrl = require('../../controllers/cropModule/crop.controller');
const  authMiddleware  = require('../../middleware/auth.middleware.js');
const router = express.Router();

router.post('/',authMiddleware, ctrl.create);
router.get('/',authMiddleware, ctrl.list);
router.get('/:id',authMiddleware, ctrl.getById);
router.put('/:id',authMiddleware, ctrl.updateById);
router.delete('/:id',authMiddleware, ctrl.deleteById);

module.exports = router;
