const mongoose = require('mongoose');

const InstrumentVolumeBound = new mongoose.Schema({
  instrument_id: {
    type: mongoose.Schema.ObjectId,
    required: true,
  },

  quantity: {
    type: Number,
    required: true,
  },

  is_active: {
    type: Boolean,
    default: true,
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

module.exports = mongoose.model('InstrumentVolumeBound', InstrumentVolumeBound, 'instrument-volume-bounds');
