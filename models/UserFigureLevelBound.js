const mongoose = require('mongoose');

const {
  INTERVALS,
} = require('../controllers/candles/constants');

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
    enum: [...INTERVALS.values()],
  },

  is_long: {
    type: Boolean,
    required: true,
  },

  is_active: {
    type: Boolean,
    default: true,
  },

  is_moderated: {
    type: Boolean,
    default: false,
  },

  is_worked: {
    type: Boolean,
    default: false,
  },

  worked_at: {
    type: Date,
  },

  level_start_candle_time: {
    type: Date,
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
};

const UserFigureLevelBound = new mongoose.Schema(modelSchema, { versionKey: false });

module.exports = mongoose.model('UserFigureLevelBound', UserFigureLevelBound, 'user-figure-level-bounds');
module.exports.modelSchema = modelSchema;
