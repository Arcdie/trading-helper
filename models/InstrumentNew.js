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

  is_futures: {
    type: Boolean,
    required: true,
  },

  average_volume_for_last_15_minutes: {
    type: Number,
    default: 0,
  },

  does_exist_robot: {
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
