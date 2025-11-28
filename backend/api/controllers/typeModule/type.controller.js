const typeService = require('../../../services/type.service');

const createTypeController = async (req, res) => {
  try {
    const type = await typeService.createType(req.body);
    res.status(201).send(type);
  } catch (error) {
    res.status(400).send({ message: error.message || 'Failed to create type', error });
  }
};

const getTypesController = async (req, res) => {
  try {
    // Pass the entire query object (including ids or type)
    const types = await typeService.getTypes(req.query);
    res.status(200).send(types);
  } catch (error) {
    res.status(400).send({ message: error.message || 'Failed to fetch types', error });
  }
};

const getTypeByIdController = async (req, res) => {
  try {
    const type = await typeService.getTypeById(req.params.id);
    if (!type) {
      return res.status(404).send({ message: 'Type not found' });
    }
    res.status(200).send(type);
  } catch (error) {
    res.status(400).send({ message: error.message || 'Failed to fetch type', error });
  }
};

const updateTypeController = async (req, res) => {
  try {
    const type = await typeService.updateType(req.params.id, req.body);
    if (!type) {
      return res.status(404).send({ message: 'Type not found' });
    }
    res.status(200).send(type);
  } catch (error) {
    res.status(400).send({ message: error.message || 'Failed to update type', error });
  }
};

const deleteTypeController = async (req, res) => {
  try {
    const type = await typeService.deleteType(req.params.id);
    if (!type) {
      return res.status(404).send({ message: 'Type not found' });
    }
    res.status(204).send(); // No content on successful deletion
  } catch (error) {
    res.status(400).send({ message: error.message || 'Failed to delete type', error });
  }
};

module.exports = {
  createTypeController,
  getTypesController,
  getTypeByIdController,
  updateTypeController,
  deleteTypeController,
};
