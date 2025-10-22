const EventStream = require('../models/eventStream/eventStream.model.js');

// ✅ Fetch events (with optional ?ids=id1,id2 support)
const getEvents = async (queryParams) => {
  const { ids, ...filters } = queryParams;

  if (ids) {
    const idArray = ids.split(',').map(id => id.trim());
    return await EventStream.find({ _id: { $in: idArray } }); // ✅ returns full data now
  }

  return await EventStream.find(filters);
};

// ✅ Update event status for a specific user
const updateEventStatus = async (eventId, userId, status) => {
  return await EventStream.findOneAndUpdate(
    { _id: eventId, 'RelatedUsers._id': userId },
    { $set: { 'RelatedUsers.$.status': status } },
    { new: true }
  );
};

// ✅ Push (create) a new event
const pushEvent = async (eventData) => {
  const newEvent = new EventStream(eventData);
  return await newEvent.save();
};

// ✅ Export all functions properly
module.exports = {
  getEvents,
  updateEventStatus,
  pushEvent
};
