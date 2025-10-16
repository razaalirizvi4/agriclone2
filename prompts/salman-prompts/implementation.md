const { success, fail } = require('../utils/apiResponse');
const service = require('../services/crop.service');

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
        return res.json(success(crops));
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



const { Schema, model } = require('mongoose');

const cropSchema = new Schema(
    {
        name: { type: String, required: true, trim: true, index: true },
        icon: { type: String, default: '' },
        seedDateRangeStart: { type: Date },
        seedDateRangeEnd: { type: Date },
        harvestDateRangeStart: { type: Date },
        harvestDateRangeEnd: { type: Date },
        tempRangeStart: { type: String },
        tempRangeEnd: { type: String },
        humidRangeStart: { type: String },
        humidRangeEnd: { type: String },
        yield: { type: String }
    },
    { timestamps: true }
);

module.exports = model('Crop', cropSchema);


const express = require('express');
const ctrl = require('../controllers/crop.controller');

const router = express.Router();

router.post('/', ctrl.create);
router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.put('/:id', ctrl.updateById);
router.delete('/:id', ctrl.deleteById);

module.exports = router;



const Crop = require('../models/Crop');

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



require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { connectDB } = require('./config/db');

const cropRoutes = require('./routes/crop.routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
    res.json({ ok: true });
});

app.use('/api/crops', cropRoutes);

app.use((err, req, res, next) => {
    const status = err.statusCode || 500;
    res.status(status).json({ success: false, error: { message: err.message || 'Internal Server Error' } });
});

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/agripro';

connectDB(MONGODB_URI)
    .then(() => {
        app.listen(PORT, () => {
            console.log(`API listening on http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Failed to connect to DB', err.message);
        process.exit(1);
    });



MONGODB_URI=mongodb://127.0.0.1:27017/agripro
PORT=4000
