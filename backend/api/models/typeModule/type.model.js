const mongoose = require('mongoose');

const TypeSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true
  },
  attributes: [
    {
      key: { type: String, required: true },
      valueType: { type: String, required: true }, // string | number | boolean | geojson | array | object
      required: { type: Boolean, default: false }
    }
  ]
});

module.exports = mongoose.model("Type", TypeSchema);