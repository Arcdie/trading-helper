const mongoose = require('mongoose');

const CandleHour = new mongoose.Schema({
  instrument_id: {
    type: mongoose.Schema.ObjectId,
    required: true,
  },

  // open, close, low, high
  data: [Number, Number, Number, Number],

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
}, { versionKey: false });

module.exports = mongoose.model('CandleHour', CandleHour, 'candles-hour');
