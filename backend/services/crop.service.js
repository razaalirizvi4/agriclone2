const cropDataLayer = require('../api/dataLayer/crop.dataLayer');

async function createCrop(input) {
    return cropDataLayer.createCrop(input);
}

async function listCrops(filter = {}) {
    return cropDataLayer.listCrops(filter);
}

async function getCropById(id) {
    return cropDataLayer.getCropById(id);
}

async function updateCropById(id, update) {
    return cropDataLayer.updateCropById(id, update);
}

async function deleteCropById(id) {
    return cropDataLayer.deleteCropById(id);
}

module.exports = {
    createCrop,
    listCrops,
    getCropById,
    updateCropById,
    deleteCropById
};