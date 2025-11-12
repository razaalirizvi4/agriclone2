const {
  getEvents: getEventsData,
  updateEventStatus: updateEventStatusData,
  pushEvent: pushEventData
} = require('../api/dataLayer/eventStream.dataLayer.js');
const Event = require('../api/models/eventStream/eventStream.model'); // Assuming an Event model

const getEvents = async (queryParams) => {
  return await getEventsData(queryParams);
};

const updateEventStatus = async (eventId, userId, status) => {
  return await updateEventStatusData(eventId, userId, status);
};

const pushEvent = async (eventData) => {
  return await pushEventData(eventData);
};

const createFieldLifeCycleEvents = async (field, fieldEventsInfo) => {
  // Example: Generate a 'Sowing' event
  const sowingEvent = new Event({
    locationId: field._id,
    eventType: 'Sowing',
    description: `Sowing of ${field.attributes.cropType} in ${field.name}`,
    eventDate: new Date(), // Or derive from fieldEventsInfo
    details: fieldEventsInfo,
  });
  await sowingEvent.save();

  // Add more events based on fieldEventsInfo (e.g., irrigation, harvesting)
  // This part would involve more complex logic based on the lifecycle and crop type.
  // For now, a basic sowing event is shown.
};

module.exports = {
  getEvents,
  updateEventStatus,
  pushEvent,
  createFieldLifeCycleEvents
};