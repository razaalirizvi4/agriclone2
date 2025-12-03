
const locationDataLayer = require('../api/dataLayer/location.dataLayer');
const Location = require('../api/models/locationModule/location.model');
const eventStreamService = require('../services/eventStream.service'); // Assuming this service exists for event generation
const weatherService = require('./weather.service');

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

exports.farmSetup = async (locations = []) => {
  const payload = Array.isArray(locations) ? locations : [];
  const results = [];

  // Try to find the farm entry once so we can reuse its coordinates for fields
  const farmEntry =
    payload.find((entry) => (entry.type || '').toLowerCase() === 'farm') || null;

  for (const item of payload) {
    const normalizedType = (item.type || "").toLowerCase();

    if (normalizedType === "farm") { // Determine farm entries by type
      if (item._id) {
        // Edit Mode: Update existing Farm
        const updatedFarm = await Location.findByIdAndUpdate(item._id, item, { new: true });
        results.push({ type: 'farm', mode: 'edit', data: updatedFarm });

        // Refresh weather using existing lat/lon, but don't break wizard on failure
        try {
          await weatherService.refreshWeather(updatedFarm._id);
        } catch (err) {
          console.error('Failed to refresh weather for farm', updatedFarm._id, err.message);
        }
      } else {
        // Add Mode: Create new Farm
        const newFarm = new Location(item);
        await newFarm.save();
        results.push({ type: 'farm', mode: 'add', data: newFarm });

        // Store farmId for subsequent fields
        item._id = newFarm._id;

        // Refresh weather for the new farm
        try {
          await weatherService.refreshWeather(newFarm._id);
        } catch (err) {
          console.error('Failed to refresh weather for new farm', newFarm._id, err.message);
        }
      }
    } else if (normalizedType === "field") { // Determine field entries by type
      // Ensure parentId is set from the newly created farm or existing farm
      if (!item.parentId && payload[0] && payload[0]._id) {
        item.parentId = payload[0]._id; // Assuming the first item in the array is the farm
      }

      // If field has no lat/lon but farm has, copy farm coords so weather API can work
      if (!item.attributes) {
        item.attributes = {};
      }
      if (farmEntry && farmEntry.attributes) {
        if (
          (item.attributes.lat === undefined || item.attributes.lat === null) &&
          typeof farmEntry.attributes.lat === 'number'
        ) {
          item.attributes.lat = farmEntry.attributes.lat;
        }
        if (
          (item.attributes.lon === undefined || item.attributes.lon === null) &&
          typeof farmEntry.attributes.lon === 'number'
        ) {
          item.attributes.lon = farmEntry.attributes.lon;
        }
      }

      if (item._id) {
        // Edit Mode: Update existing Field
        const updatedField = await Location.findByIdAndUpdate(item._id, item, { new: true });
        results.push({ type: 'field', mode: 'edit', data: updatedField });

        // Refresh weather for updated field
        try {
          await weatherService.refreshWeather(updatedField._id);
        } catch (err) {
          console.error('Failed to refresh weather for field', updatedField._id, err.message);
        }
      } else {
        // Add Mode: Create new Field
        const newField = new Location(item);
        await newField.save();
        results.push({ type: 'field', mode: 'add', data: newField });

        // Refresh weather for new field
        try {
          await weatherService.refreshWeather(newField._id);
        } catch (err) {
          console.error('Failed to refresh weather for new field', newField._id, err.message);
        }

        // Generate lifecycle events for the new field
        if (item.fieldEventsInfo) {
          await eventStreamService.createFieldLifeCycleEvents(newField, item.fieldEventsInfo);
        }
      }
    }
  }
  return results;
};
