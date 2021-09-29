const mongoose = require('mongoose');

const {
  DEFAULT_INDENT_IN_PERCENTS,
} = require('../controllers/user-level-bounds/constants');

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

  price_plus_indent: {
    type: Number,
    required: true,
    index: true,
  },

  price_minus_indent: {
    type: Number,
    required: true,
    index: true,
  },

  indent_in_percents: {
    type: Number,
    required: true,
    default: DEFAULT_INDENT_IN_PERCENTS,
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

  worked_at: Date,
}, { versionKey: false });

module.exports = mongoose.model('UserLevelBound', UserLevelBound, 'user-level-bounds');
