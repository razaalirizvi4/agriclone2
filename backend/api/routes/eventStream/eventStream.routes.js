const express = require('express');
const { getEventsController, pullEventController, createFieldEventsController, deleteEventsByFieldIdsController } = require('../../controllers/eventStream/eventStream.controller.js')
const  authMiddleware  = require('../../middleware/auth.middleware.js');

const router = express.Router();

router.get('/', authMiddleware, getEventsController);
router.put('/pull/:eventId', authMiddleware ,  pullEventController);
router.post('/field-events', authMiddleware, createFieldEventsController);
router.delete('/field-events', authMiddleware, deleteEventsByFieldIdsController);

module.exports = router;