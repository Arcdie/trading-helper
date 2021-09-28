const mongoose = require('mongoose');

const UserLevelBound = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.ObjectId,
    required: true,
  },

  instrument_id: {
    type: mongoose.Schema.ObjectId,
    required: true,
  },

  price_original: {
    type: Number,
    required: true,
  },

  price_with_indent: {
    type: Number,
    required: true,
  },

  indent_in_percents: {
    type: Number,
    required: true,
  },

  is_worked: {
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

module.exports = mongoose.model('UserLevelBound', UserLevelBound, 'user-level-bounds');
