const {
  getEvents: getEventsData,
  updateEventStatus: updateEventStatusData,
  pushEvent: pushEventData
} = require('../api/dataLayer/eventStream.dataLayer.js');

const getEvents = async (queryParams) => {
  return await getEventsData(queryParams);
};

const updateEventStatus = async (eventId, userId, status) => {
  return await updateEventStatusData(eventId, userId, status);
};

const pushEvent = async (eventData) => {
  return await pushEventData(eventData);
};

module.exports = {
  getEvents,
  updateEventStatus,
  pushEvent
};