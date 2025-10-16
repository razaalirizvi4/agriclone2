const express = require('express');
const ctrl = require('../../controllers/cropModule/crop.controller');

const router = express.Router();

router.post('/', ctrl.create);
router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.put('/:id', ctrl.updateById);
router.delete('/:id', ctrl.deleteById);

module.exports = router;
