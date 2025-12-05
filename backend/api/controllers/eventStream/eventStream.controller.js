const { getEvents, updateEventStatus, createFieldLifeCycleEvents, deleteEventsByFieldIds } = require('../../../services/eventStream.service')

const getEventsController = async (req, res) => {
  try {
    const events = await getEvents(req.query);
    res.status(200).json(events);
  } catch (error) {
    console.error("❌ [eventStream.controller.js] Error fetching events:", error);
    res.status(500).json({ message: error.message });
  }
};

const pullEventController = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userId, status } = req.body;
    const updatedEvent = await updateEventStatus(eventId, userId, status);
    res.status(200).json(updatedEvent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createFieldEventsController = async (req, res) => {
  try {
    const { cropId, recipeId, fieldId, startDate, cropStage } = req.body;
    
    if (!cropId || !recipeId || !fieldId) {
      return res.status(400).json({ 
        message: 'cropId, recipeId, and fieldId are required' 
      });
    }
    
    const result = await createFieldLifeCycleEvents({
      cropId,
      recipeId,
      fieldId,
      startDate: startDate ? new Date(startDate) : new Date(),
      cropStage,
      save: true
    });
    
    res.status(201).json({
      message: 'Field lifecycle events created successfully',
      events: result.savedEvents,
      count: result.savedEvents?.length
    });
  } catch (error) {
    console.error("❌ [eventStream.controller.js] Error creating field events:", error);
    res.status(500).json({ message: error.message || 'Failed to create field events' });
  }
};

const deleteEventsByFieldIdsController = async (req, res) => {
  try {
    const { fieldIds } = req.body;
    
    if (!fieldIds || !Array.isArray(fieldIds) || fieldIds.length === 0) {
      return res.status(400).json({ 
        message: 'fieldIds array is required' 
      });
    }
    
    const result = await deleteEventsByFieldIds(fieldIds);
    
    res.status(200).json({
      message: 'Events deleted successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error("❌ [eventStream.controller.js] Error deleting events by field IDs:", error);
    res.status(500).json({ message: error.message || 'Failed to delete events' });
  }
};

module.exports = {
  getEventsController,
  pullEventController,
  createFieldEventsController,
  deleteEventsByFieldIdsController
};