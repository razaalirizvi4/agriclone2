const { success, fail } = require('../../../utils/apiResponse');
const service = require('../../../services/crop.service');

function parseDate(value) {
    if (!value) return undefined;
    const d = new Date(value);
    return isNaN(d.getTime()) ? undefined : d;
}

function toNumber(value) {
    if (value === null || value === undefined || value === '') return undefined;
    const num = Number(value);
    return Number.isNaN(num) ? undefined : num;
}

function buildRange(minVal, maxVal) {
    const min = toNumber(minVal);
    const max = toNumber(maxVal);
    if (min === undefined && max === undefined) return undefined;
    return { min, max };
}

function buildTemporalConstraints(body) {
    const temporal = {
        seedDateRangeStart: parseDate(body.seedDateRangeStart),
        seedDateRangeEnd: parseDate(body.seedDateRangeEnd),
        harvestDateRangeStart: parseDate(body.harvestDateRangeStart),
        harvestDateRangeEnd: parseDate(body.harvestDateRangeEnd)
    };
    return Object.values(temporal).every(v => v === undefined) ? undefined : temporal;
}

function buildEnvironmentalConditions(body) {
    const temperature = buildRange(body.tempRangeStart, body.tempRangeEnd);
    const humidity = buildRange(body.humidRangeStart, body.humidRangeEnd);

    if (!temperature && !humidity) return undefined;

    return {
        temperature,
        humidity
    };
}

function buildExpectedYield(body) {
    const value = toNumber(body.yield ?? body.expectedYieldValue);
    if (value === undefined) return undefined;
    return {
        value,
        unit: body.expectedYieldUnit,
        areaBasis: body.expectedYieldAreaBasis,
        notes: body.expectedYieldNotes
    };
}

function buildLegacyRecipe(body) {
    const recipeInfo = {
        description: body.recipeDescription,
        createdBy: body.recipeCreatedBy,
        createdAt: parseDate(body.recipeCreatedAt),
        updatedAt: parseDate(body.recipeUpdatedAt),
        expectedYield: buildExpectedYield(body)
    };

    const recipeRules = {
        temporalConstraints: buildTemporalConstraints(body),
        environmentalConditions: buildEnvironmentalConditions(body)
    };

    const cleanedRecipeInfo = Object.fromEntries(
        Object.entries(recipeInfo).filter(([_, v]) => v !== undefined)
    );

    if (Object.keys(cleanedRecipeInfo).length === 0 && Object.values(recipeRules).every(v => v === undefined)) {
        return undefined;
    }

    return {
        id: body.recipeId || 'default-recipe',
        recipeInfo: cleanedRecipeInfo,
        recipeRules: Object.fromEntries(
            Object.entries(recipeRules).filter(([_, v]) => v !== undefined)
        ),
        recipeWorkflows: Array.isArray(body.recipeWorkflows) ? body.recipeWorkflows : []
    };
}

function buildPayload(body) {
    const payload = {
        name: body.name,
        icon: body.icon,
        actualYield: toNumber(body.actualYield)
    };

    if (Array.isArray(body.recipes)) {
        payload.recipes = body.recipes;
    } else {
        const legacyRecipe = buildLegacyRecipe(body);
        if (legacyRecipe) {
            payload.recipes = [legacyRecipe];
        }
    }

    if (payload.actualYield === undefined) {
        delete payload.actualYield;
    }

    return payload;
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
        const crops = await service.listCrops({ 
            name: req.query.name,
            ids: req.query.ids
        });
        res.status(200).send(crops);
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
