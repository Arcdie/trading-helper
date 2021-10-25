const mongoose = require('mongoose');

const Candle = new mongoose.Schema({
  instrument_id: {
    type: mongoose.Schema.ObjectId,
    required: true,
  },

  // open, close, low, high, volume
  data: [Number, Number, Number, Number, Number],

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

module.exports = mongoose.model('Candle', Candle, 'candles');
