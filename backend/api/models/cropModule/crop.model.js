const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const cropSchema = new Schema(
    {
        _id: { type: Schema.Types.ObjectId, default: mongoose.Types.ObjectId },
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