const mongoose = require('mongoose');

const modelSchema = {
  instrument_id: {
    type: mongoose.Schema.ObjectId,
    required: true,
    index: true,
  },

  price: {
    type: Number,
    required: true,
  },

  quantity: {
    type: Number,
    required: true,
  },

  is_long: {
    type: Boolean,
    required: true,
  },

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
