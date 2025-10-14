
const Location = require('../models/locationModule/location.model');

exports.createLocation = async (locationData) => {
  const location = new Location(locationData);
  return await location.save();
};

exports.getLocations = async () => {
  return await Location.find();
};

exports.getLocationById = async (id) => {
  return await Location.findById(id);
};

exports.updateLocation = async (id, locationData) => {
  return await Location.findByIdAndUpdate(id, locationData, { new: true, runValidators: true });
};

exports.deleteLocation = async (id) => {
  return await Location.findByIdAndDelete(id);
};
