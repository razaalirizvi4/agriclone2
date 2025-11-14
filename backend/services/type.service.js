const Type = require('../api/models/typeModule/type.model');

const createType = async (typeData) => {
  const type = new Type(typeData);
  return await type.save();
};

const updateType = async (id, typeData) => {
  return await Type.findByIdAndUpdate(id, typeData, { new: true });
};

const deleteType = async (id) => {
  return await Type.findByIdAndDelete(id);
};

const getTypes = async (query) => {
  return await Type.find(query);
};

const getTypeById = async (id) => {
  return await Type.findById(id);
};

module.exports = {
  createType,
  updateType,
  deleteType,
  getTypes,
  getTypeById,
};