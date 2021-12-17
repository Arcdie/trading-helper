const mongoose = require('mongoose');

const modelSchema = {
  instrument_id: {
    type: mongoose.Schema.ObjectId,
    required: true,
    index: true,
  },

  // open, close, low, high
  data: [{ type: Number }, { type: Number }, { type: Number }, { type: Number }],

  volume: {
    type: Number,
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

const Candle5m = new mongoose.Schema(modelSchema, { versionKey: false });

module.exports = mongoose.model('Candle5m', Candle5m, 'candles-5m');
module.exports.modelSchema = modelSchema;
