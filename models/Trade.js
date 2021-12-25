const mongoose = require('mongoose');

const modelSchema = {
  // price, quantity, isLong
  data: [{ type: Number }, { type: Number }, { type: Boolean }],

  time: {
    type: Date,
    required: true,
    index: true,
  },

  created_at: {
    type: Date,
    required: true,
    default: Date.now,
  },
};

const Trade = new mongoose.Schema(modelSchema, { versionKey: false });

module.exports = mongoose.model('Trade', Trade, 'trades');
module.exports.modelSchema = modelSchema;
