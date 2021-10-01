const mongoose = require('mongoose');

const Instrument = new mongoose.Schema({
  name_futures: {
    unique: true,
    type: String,
    required: true,
  },

  name_spot: {
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

  /* Deprecated
  is_moderated: {
    type: Boolean,
    default: false,
  },
  moderated_at: Date,
   */
}, { versionKey: false });

module.exports = mongoose.model('Instrument', Instrument, 'instruments');
