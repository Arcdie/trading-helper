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

  price_angle: {
    type: Number,
    required: true,
  },

  line_timeframe: {
    type: String,
    required: true,
    enum: [...INTERVALS.values()],
  },

  line_start_candle_extremum: {
    type: Number,
    required: true,
  },

  line_start_candle_time: {
    type: Date,
    required: true,
  },

  is_long: {
    type: Boolean,
    required: true,
  },

  is_moderated: {
    type: Boolean,
    default: false,
  },

  is_active: {
    type: Boolean,
    default: true,
  },

  is_worked: {
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

const UserFigureLineBound = new mongoose.Schema(modelSchema, { versionKey: false });

module.exports = mongoose.model('UserFigureLineBound', UserFigureLineBound, 'user-figure-line-bounds');
module.exports.modelSchema = modelSchema;
