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
    index: true,
    type: mongoose.Schema.ObjectId,
    required: true,
  },

  price_original: {
    type: Number,
    required: true,
  },

  indent_in_percents: {
    type: Number,
    required: true,
    default: DEFAULT_INDENT_IN_PERCENTS,
  },

  is_long: {
    type: Boolean,
    required: true,
  },

  is_worked: {
    index: true,
    type: Boolean,
    default: false,
  },

  is_sended_in_telegram: {
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
