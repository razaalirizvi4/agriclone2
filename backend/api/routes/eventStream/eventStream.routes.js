const express = require('express');
const { getEventsController, pullEventController } = require('../../controllers/eventStream/eventStream.controller.js')
const  authMiddleware  = require('../../middleware/auth.middleware.js');

const router = express.Router();

router.get('/', getEventsController);
router.put('/pull/:eventId', pullEventController);

module.exports = router;