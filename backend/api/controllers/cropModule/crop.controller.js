const { success, fail } = require('../../../utils/apiResponse');
const service = require('../../../services/crop.service');

function parseDate(value) {
    if (!value) return undefined;
    const d = new Date(value);
    return isNaN(d.getTime()) ? undefined : d;
}

function buildPayload(body) {
    return {
        name: body.name,
        icon: body.icon,
        seedDateRangeStart: parseDate(body.seedDateRangeStart),
        seedDateRangeEnd: parseDate(body.seedDateRangeEnd),
        harvestDateRangeStart: parseDate(body.harvestDateRangeStart),
        harvestDateRangeEnd: parseDate(body.harvestDateRangeEnd),
        tempRangeStart: body.tempRangeStart,
        tempRangeEnd: body.tempRangeEnd,
        humidRangeStart: body.humidRangeStart,
        humidRangeEnd: body.humidRangeEnd,
        yield: body.yield
    };
}

async function create(req, res) {
    try {
        if (!req.body?.name) {
            return res.status(400).json(fail('name is required'));
        }
        const payload = buildPayload(req.body);
        const crop = await service.createCrop(payload);
        return res.status(201).json(success(crop));
    } catch (err) {
        return res.status(500).json(fail(err.message));
    }
}

async function list(req, res) {
    try {
        const crops = await service.listCrops({ name: req.query.name });
        res.status(200).json(crops)
    } catch (err) {
        return res.status(500).json(fail(err.message));
    }
}

async function getById(req, res) {
    try {
        const crop = await service.getCropById(req.params.id);
        if (!crop) return res.status(404).json(fail('Crop not found'));
        return res.json(success(crop));
    } catch (err) {
        return res.status(500).json(fail(err.message));
    }
}

async function updateById(req, res) {
    try {
        const payload = buildPayload(req.body);
        const crop = await service.updateCropById(req.params.id, payload);
        if (!crop) return res.status(404).json(fail('Crop not found'));
        return res.json(success(crop));
    } catch (err) {
        return res.status(500).json(fail(err.message));
    }
}

async function deleteById(req, res) {
    try {
        const crop = await service.deleteCropById(req.params.id);
        if (!crop) return res.status(404).json(fail('Crop not found'));
        return res.json(success({ deleted: true }));
    } catch (err) {
        return res.status(500).json(fail(err.message));
    }
}

module.exports = { create, list, getById, updateById, deleteById };
