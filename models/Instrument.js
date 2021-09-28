const mongoose = require('mongoose');

const Instrument = new mongoose.Schema({
  name: {
    unique: true,
    type: String,
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

module.exports = mongoose.model('Instrument', Instrument, 'instruments');
