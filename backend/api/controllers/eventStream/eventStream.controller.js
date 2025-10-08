const { getEvents, updateEventStatus } = require('../../../services/eventStream.service')

const getEventsController = async (req, res) => {
  try {
    const events = await getEvents(req.query);
    res.status(200).json(events);
  } catch (error) {
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

module.exports = {
  getEventsController,
  pullEventController
};