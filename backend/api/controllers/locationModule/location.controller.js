
const locationService = require('../../../services/location.service');

exports.createLocation = async (req, res) => {
  try {
    const location = await locationService.createLocation(req.body);
    res.status(201).send(location);
  } catch (error) {
    res.status(400).send(error);
  }
};

exports.getLocations = async (req, res) => {
  try {
    const locations = await locationService.getLocations();
    res.status(200).send(locations);
  } catch (error) {
    res.status(500).send(error);
  }
};

exports.getLocationById = async (req, res) => {
  try {
    const location = await locationService.getLocationById(req.params.id);
    if (!location) {
      return res.status(404).send();
    }
    res.status(200).send(location);
  } catch (error) {
    res.status(500).send(error);
  }
};

exports.updateLocation = async (req, res) => {
  try {
    const location = await locationService.updateLocation(req.params.id, req.body);
    if (!location) {
      return res.status(404).send();
    }
    res.status(200).send(location);
  } catch (error) {
    res.status(400).send(error);
  }
};

exports.deleteLocation = async (req, res) => {
  try {
    const location = await locationService.deleteLocation(req.params.id);
    if (!location) {
      return res.status(404).send();
    }
    res.status(200).send(location);
  } catch (error) {
    res.status(500).send(error);
  }
};
