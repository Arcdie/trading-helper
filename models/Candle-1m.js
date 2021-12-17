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

const Candle1m = new mongoose.Schema(modelSchema, { versionKey: false });

module.exports = mongoose.model('Candle1m', Candle1m, 'candles-1m');
module.exports.modelSchema = modelSchema;
