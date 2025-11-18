const mongoose = require('mongoose');
const { Schema, model } = mongoose;

// --- Subschemas ---

const ExpectedYieldSchema = new Schema({
    value: Number,
    unit: String,
    areaBasis: String,
    notes: String
}, { _id: false });

const TemporalConstraintsSchema = new Schema({
    seedDateRangeStart: Date,
    seedDateRangeEnd: Date,
    harvestDateRangeStart: Date,
    harvestDateRangeEnd: Date
}, { _id: false });

const SoilPHSchema = new Schema({
    min: Number,
    max: Number,
    optimal: Number,
    unit: String
}, { _id: false });

const RangeSchema = new Schema({
    min: Number,
    max: Number,
    optimal: Number,
    unit: String
}, { _id: false });

const SoilTypeSchema = new Schema({
    allowed: [String],
    preferred: [String],
    excluded: [String]
}, { _id: false });

const TemperatureSchema = RangeSchema;
const HumiditySchema = RangeSchema;
const RainfallSchema = RangeSchema;

const EnvironmentalConditionsSchema = new Schema({
    soilPH: SoilPHSchema,
    temperature: TemperatureSchema,
    humidity: HumiditySchema,
    rainfall: RainfallSchema,
    soilType: SoilTypeSchema
}, { _id: false });

const CropRotationSchema = new Schema({
    avoidPreviousCrops: [String],
    preferredPreviousCrops: [String],
    minRotationInterval: Number,
    maxConsecutiveYears: Number
}, { _id: false });

const FieldRestPeriodSchema = new Schema({
    min: Number,
    unit: String
}, { _id: false });

const PreviousCropHarvestDateSchema = new Schema({
    minDaysBeforeSowing: Number,
    maxDaysBeforeSowing: Number
}, { _id: false });

const HistoricalConstraintsSchema = new Schema({
    cropRotation: CropRotationSchema,
    fieldRestPeriod: FieldRestPeriodSchema,
    previousCropHarvestDate: PreviousCropHarvestDateSchema
}, { _id: false });

const RecipeRulesSchema = new Schema({
    temporalConstraints: TemporalConstraintsSchema,
    environmentalConditions: EnvironmentalConditionsSchema,
    historicalConstraints: HistoricalConstraintsSchema
}, { _id: false });

const EquipmentSchema = new Schema({
    name: String,
    quantity: Number,
    optional: Boolean
}, { _id: false });

const WorkflowStepSchema = new Schema({
    stepName: String,
    sequence: Number,
    duration: Number,
    equipmentRequired: [EquipmentSchema]
}, { _id: false });

const RecipeInfoSchema = new Schema({
    description: String,
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    createdAt: Date,
    updatedAt: Date,
    expectedYield: ExpectedYieldSchema
}, { _id: false });

const RecipeSchema = new Schema({
    id: String,
    recipeInfo: RecipeInfoSchema,
    recipeRules: RecipeRulesSchema,
    recipeWorkflows: [WorkflowStepSchema]
});


// --- MAIN CROP SCHEMA ---

const cropSchema = new Schema(
    {
        _id: { type: Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
        name: { type: String, required: true, trim: true, index: true },
        icon: { type: String, default: '' },
        actualYield: { type: Number, default: null },
        recipes: [RecipeSchema]
    },
    { timestamps: true }
);

module.exports = model("Crop", cropSchema);
