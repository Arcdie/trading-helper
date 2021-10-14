const mongoose = require('mongoose');

const Candle = new mongoose.Schema({
  instrument_id: {
    type: mongoose.Schema.ObjectId,
    required: true,
  },

  high: {
    type: Number,
    required: true,
  },

  low: {
    type: Number,
    required: true,
  },

  open: {
    type: Number,
    required: true,
  },

  close: {
    type: Number,
    required: true,
  },

  volume: {
    type: Number,
    required: true,
  },

  time: {
    type: Date,
    required: true,
  },

  created_at: {
    type: Date,
    required: true,
    default: Date.now,
  },

  updated_at: {
    type: Date,
    required: true,
    default: Date.now,
  },
}, { versionKey: false });

module.exports = mongoose.model('Candle', Candle, 'candles');
