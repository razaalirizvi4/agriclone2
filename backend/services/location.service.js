
const locationDataLayer = require('../api/dataLayer/location.dataLayer');
const Location = require('../api/models/locationModule/location.model');
const eventStreamService = require('./eventStream.service'); // Assuming this service exists for event generation

exports.createLocation = async (locationData) => {
  return await locationDataLayer.createLocation(locationData);
};

exports.getLocations = async (query) => {
  return await locationDataLayer.getLocations(query);
};

exports.getLocationById = async (id) => {
  return await locationDataLayer.getLocationById(id);
};

exports.updateLocation = async (id, locationData) => {
  return await locationDataLayer.updateLocation(id, locationData);
};

exports.deleteLocation = async (id) => {
  return await locationDataLayer.deleteLocation(id);
};

exports.farmSetup = async (locations) => {
  const results = [];

  for (const item of locations) {
    if (item.typeId === "<FarmTypeId>") { // Assuming a way to identify a farm
      // Farm object
      if (item._id) {
        // Edit Mode: Update existing Farm
        const updatedFarm = await Location.findByIdAndUpdate(item._id, item, { new: true });
        results.push({ type: 'farm', mode: 'edit', data: updatedFarm });
      } else {
        // Add Mode: Create new Farm
        const newFarm = new Location(item);
        await newFarm.save();
        results.push({ type: 'farm', mode: 'add', data: newFarm });

        // Store farmId for subsequent fields
        item._id = newFarm._id;
      }
    } else if (item.typeId === "<FieldTypeId>") { // Assuming a way to identify a field
      // Field object
      if (item._id) {
        // Edit Mode: Update existing Field
        const updatedField = await Location.findByIdAndUpdate(item._id, item, { new: true });
        results.push({ type: 'field', mode: 'edit', data: updatedField });
      } else {
        // Add Mode: Create new Field
        // Ensure parentId is set from the newly created farm or existing farm
        if (!item.parentId && locations[0] && locations[0]._id) {
          item.parentId = locations[0]._id; // Assuming the first item in the array is the farm
        }

        const newField = new Location(item);
        await newField.save();
        results.push({ type: 'field', mode: 'add', data: newField });

        // Generate lifecycle events for the new field
        if (item.fieldEventsInfo) {
          await eventStreamService.createFieldLifeCycleEvents(newField, item.fieldEventsInfo);
        }
      }
    }
  }
  return results;
};
