const mongoose = require('mongoose');

const UserVolumeBound = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.ObjectId,
    required: true,
  },

  instrument_id: {
    type: mongoose.Schema.ObjectId,
    required: true,
  },

  instrument_volume_bound_id: {
    type: mongoose.Schema.ObjectId,
    required: true,
  },

  user_trade_bound_id: {
    type: mongoose.Schema.ObjectId,
    required: true,
  },

  is_active: {
    type: Boolean,
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

module.exports = mongoose.model('UserVolumeBound', UserVolumeBound, 'user-volume-bounds');
