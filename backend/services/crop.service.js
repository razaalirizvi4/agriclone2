const Crop = require('../api/models/cropModule/crop.model');

async function createCrop(input) {
    const crop = await Crop.create(input);
    return crop;
}

async function listCrops(filter = {}) {
    const query = {};
    if (filter.name) {
        query.name = { $regex: filter.name, $options: 'i' };
    }
    return Crop.find(query).sort({ createdAt: -1 });
}

async function getCropById(id) {
    return Crop.findById(id);
}

async function updateCropById(id, update) {
    return Crop.findByIdAndUpdate(id, update, { new: true });
}

async function deleteCropById(id) {
    return Crop.findByIdAndDelete(id);
}

module.exports = {
    createCrop,
    listCrops,
    getCropById,
    updateCropById,
    deleteCropById
};
