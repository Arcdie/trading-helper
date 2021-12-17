const mongoose = require('mongoose');

const modelSchema = {
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

  end_quantity: {
    type: Number,
  },

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

  volume_started_at: {
    type: Date,
  },

  volume_ended_at: {
    type: Date,
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
};

const InstrumentVolumeBound = new mongoose.Schema(modelSchema, { versionKey: false });

module.exports = mongoose.model('InstrumentVolumeBound', InstrumentVolumeBound, 'instrument-volume-bounds');
module.exports.modelSchema = modelSchema;
