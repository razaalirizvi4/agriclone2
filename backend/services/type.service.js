const {
  createTypeDB,
  getTypesDB,
  getTypeByIdDB,
  updateTypeDB,
  deleteTypeDB,
} = require('../api/dataLayer/type.dataLayer');

const createType = async (typeData) => {
  return await createTypeDB(typeData);
};

const getTypes = async (query) => {
  return await getTypesDB(query);
};

const getTypeById = async (id) => {
  return await getTypeByIdDB(id);
};

const updateType = async (id, typeData) => {
  return await updateTypeDB(id, typeData);
};

const deleteType = async (id) => {
  return await deleteTypeDB(id);
};

module.exports = {
  createType,
  getTypes,
  getTypeById,
  updateType,
  deleteType,
};