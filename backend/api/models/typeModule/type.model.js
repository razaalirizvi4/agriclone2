const mongoose = require("mongoose");

const TypeSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["farm", "field"],
    required: true,
    unique: true,
  },
  attributes: [
  {
    _id: false,
    key: { type: String, required: true },
    label: { type: String, required: true },
    valueType: { type: String, required: true }, // e.g., "GeoJSON", "Number"
    required: { type: Boolean, default: false },
    inputHint: { type: String }, // e.g., "Enter GeoJSON coordinates"
    example: { type: Object },   // optional sample value
    
    direction: {
      type: String,
      enum: ["input", "output", "both"],
      default: "input",
      required: false
    },

    // Required: which module(s) can use this attribute
    modules: {
      type: [String],  // e.g., ["mapbox"]
      required: true
    },

    inputConfig: {
      type: Object,
      default: {}
    },

    outputConfig: {
      type: Object,
      default: {}
    }
  }
]
});

module.exports = mongoose.model("Type", TypeSchema);