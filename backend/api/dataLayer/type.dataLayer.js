// api/data/typeModule/type.data.js
const mongoose = require('mongoose');
const Type = require('../models/typeModule/type.model');

const createTypeDB = async (data) => {
  const type = new Type(data);
  return await type.save();
};

const getTypesDB = async (query) => {
  let filter = {};

  // If query.ids is provided as comma-separated string: ?ids=id1,id2
  if (query?.ids) {
    const idsArray = query.ids
      .split(",")
      .map((id) => new mongoose.Types.ObjectId(id.trim()));
    
    filter._id = { $in: idsArray };
  }

  // If query.type is provided: ?type=farm
  if (query?.type) {
    filter.type = query.type.trim().toLowerCase();
  }

  return await Type.find(filter);
};

const getTypeByIdDB = async (id) => {
  return await Type.findById(id);
};

const updateTypeDB = async (id, data) => {
  return await Type.findByIdAndUpdate(id, data, { new: true });
};

const deleteTypeDB = async (id) => {
  return await Type.findByIdAndDelete(id);
};

module.exports = {
  createTypeDB,
  getTypesDB,
  getTypeByIdDB,
  updateTypeDB,
  deleteTypeDB,
};
