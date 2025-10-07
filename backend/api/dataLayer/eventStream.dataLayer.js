const EventStream = require('../models/eventStream/eventStream.model.js');

const getEvents = async (queryParams) => {
  return await EventStream.find(queryParams);
};

const updateEventStatus = async (eventId, userId, status) => {
  return await EventStream.findOneAndUpdate(
    { _id: eventId, 'RelatedUsers._id': userId },
    { $set: { 'RelatedUsers.$.status': status } },
    { new: true }
  );
};

const pushEvent = async (eventData) => {
  const newEvent = new EventStream(eventData);
  return await newEvent.save();
};

module.exports = {
  getEvents,
  updateEventStatus,
  pushEvent
};