const mongoose = require('mongoose');

const {
  DEFAULT_INDENT_IN_PERCENTS,
} = require('../controllers/user-level-bounds/constants');

const modelSchema = {
  user_id: {
    type: mongoose.Schema.ObjectId,
    required: true,
    index: true,
  },

  instrument_id: {
    type: mongoose.Schema.ObjectId,
    required: true,
    index: true,
  },

  level_price: {
    type: Number,
    required: true,
  },

  level_timeframe: {
    type: String,
    required: true,
  },

  // line has to draw from date point
  level_start_candle_time: {
    type: Date,
    required: true,
  },

  /*
  indent_in_percents: {
    type: Number,
    required: true,
    default: DEFAULT_INDENT_IN_PERCENTS,
  },
  */

  is_long: {
    type: Boolean,
    required: true,
  },

  is_worked: {
    type: Boolean,
    default: false,
  },

  is_sended_in_telegram: {
    type: Boolean,
    default: false,
  },

  worked_at: {
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

const UserLevelBound = new mongoose.Schema(modelSchema, { versionKey: false });

module.exports = mongoose.model('UserLevelBound', UserLevelBound, 'user-level-bounds');
module.exports.modelSchema = modelSchema;
