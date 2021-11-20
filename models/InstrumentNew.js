const mongoose = require('mongoose');

const InstrumentNew = new mongoose.Schema({
  name: {
    unique: true,
    type: String,
    required: true,
  },

  price: {
    type: Number,
    required: true,
  },

  is_active: {
    type: Boolean,
    required: true,
  },

  tick_size: {
    type: Number,
    required: true,
  },

  step_size: {
    type: Number,
    required: true,
  },

  is_futures: {
    type: Boolean,
    required: true,
  },

  average_volume_for_last_24_hours: {
    type: Number,
    default: 0,
  },

  average_volume_for_last_15_minutes: {
    type: Number,
    default: 0,
  },

  does_exist_robot: {
    type: Boolean,
    default: false,
  },

  does_ignore_volume: {
    type: Boolean,
    default: false,
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

module.exports = mongoose.model('InstrumentNew', InstrumentNew, 'instruments-new');
