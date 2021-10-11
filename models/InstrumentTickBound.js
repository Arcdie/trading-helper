const mongoose = require('mongoose');

const InstrumentTickBound = new mongoose.Schema({
  instrument_id: {
    type: mongoose.Schema.ObjectId,
    required: true,
  },

  instrument_tick_id: {
    type: mongoose.Schema.ObjectId,
    required: true,
  },

  start_price: Number,
  end_price: Number,

  started_at: Date,
  ended_at: Date,

  number_ticks: Number,

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

module.exports = mongoose.model('InstrumentTickBound', InstrumentTickBound, 'instrument-tick-bounds');
