
const locationDataLayer = require('../api/dataLayer/location.dataLayer');

exports.createLocation = async (locationData) => {
  return await locationDataLayer.createLocation(locationData);
};

exports.getLocations = async () => {
  return await locationDataLayer.getLocations();
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
