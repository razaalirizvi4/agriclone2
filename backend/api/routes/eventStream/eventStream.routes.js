const express = require('express');
const { getEventsController, pullEventController } = require('../../controllers/eventStream/eventStream.controller.js');
const { authMiddleware } = require('../../middleware/auth.middleware.js');

const router = express.Router();

router.get('/', authMiddleware, getEventsController);
router.put('/pull/:eventId', authMiddleware, pullEventController);

module.exports = router;