const mongoose = require('mongoose');

const InstrumentVolumeBound = new mongoose.Schema({
  instrument_id: {
    index: true,
    type: mongoose.Schema.ObjectId,
    required: true,
  },

  price: {
    type: Number,
    required: true,
  },

  start_quantity: {
    type: Number,
    required: true,
  },

  end_quantity: Number,

  min_quantity_for_cancel: {
    type: Number,
    required: true,
  },

  average_volume_for_last_24_hours: {
    type: Number,
    required: true,
  },

  average_volume_for_last_15_minutes: {
    type: Number,
    required: true,
  },

  is_ask: {
    type: Boolean,
    required: true,
  },

  is_active: {
    type: Boolean,
    default: true,
  },

  is_futures: {
    type: Boolean,
    required: true,
  },

  volume_started_at: Date,
  volume_ended_at: Date,

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

module.exports = mongoose.model('InstrumentVolumeBound', InstrumentVolumeBound, 'instrument-volume-bounds');
