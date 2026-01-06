const express = require('express');
const { getEventsController, pullEventController, createFieldEventsController, deleteEventsByFieldIdsController } = require('../../controllers/eventStream/eventStream.controller.js')
const authMiddleware = require('../../middleware/auth.middleware.js');
const permissionCheck = require('../../middleware/permission.middleware');

const router = express.Router();

router.get('/', authMiddleware, permissionCheck('view', 'events'), getEventsController);
router.put('/pull/:eventId', authMiddleware, permissionCheck('update', 'events'), pullEventController);
router.post('/field-events', authMiddleware, permissionCheck('create', 'events'), createFieldEventsController);
router.delete('/field-events', authMiddleware, permissionCheck('delete', 'events'), deleteEventsByFieldIdsController);

module.exports = router;