const mongoose = require("mongoose");
const EventStream = require('../models/eventStream/eventStream.model.js');

// ✅ Fetch events (with optional ?ids=id1,id2 support)
const getEvents = async (queryParams) => {
  const { ids, field_Ids, ...filters } = queryParams;

  if (ids) {
    const idArray = ids.split(',').map(id => id.trim());
    return await EventStream.find({ _id: { $in: idArray } });
  }

  if (field_Ids) {
    const fieldIdStrings = field_Ids.split(",").map((id) => id.trim());
    
    // Convert to ObjectIds for querying (handles both ObjectId and string storage)
    const fieldIdObjectIds = fieldIdStrings.map((id) => {
      try {
        return new mongoose.Types.ObjectId(id);
      } catch (error) {
        return null;
      }
    }).filter(Boolean);
    
    // Query for both ObjectId and string matches (since Field_id can be stored as either)
    const query = {
      $or: [
        { "RelationIds.Field_id": { $in: fieldIdObjectIds } }, // Match ObjectId
        { "RelationIds.Field_id": { $in: fieldIdStrings } },   // Match string
      ],
    };
    
    return await EventStream.find(query);
  }

  // Default: fetch all events
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

// ✅ Delete events by field IDs
const deleteEventsByFieldIds = async (fieldIds) => {
  if (!fieldIds || !Array.isArray(fieldIds) || fieldIds.length === 0) {
    return { deletedCount: 0 };
  }

  const fieldIdStrings = fieldIds.map((id) => String(id).trim()).filter(Boolean);
  
  // Convert to ObjectIds for querying (handles both ObjectId and string storage)
  const fieldIdObjectIds = fieldIdStrings.map((id) => {
    try {
      return new mongoose.Types.ObjectId(id);
    } catch (error) {
      return null;
    }
  }).filter(Boolean);
  
  // Query for both ObjectId and string matches (since Field_id can be stored as either)
  const query = {
    $or: [
      { "RelationIds.Field_id": { $in: fieldIdObjectIds } }, // Match ObjectId
      { "RelationIds.Field_id": { $in: fieldIdStrings } },   // Match string
    ],
  };
  
  const result = await EventStream.deleteMany(query);
  return { deletedCount: result.deletedCount };
};

// ✅ Export all functions properly
module.exports = {
  getEvents,
  updateEventStatus,
  pushEvent,
  deleteEventsByFieldIds
};
