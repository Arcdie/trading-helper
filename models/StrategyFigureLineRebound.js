const mongoose = require('mongoose');

const {
  INTERVALS,
} = require('../controllers/candles/constants');

const modelSchema = {
  instrument_id: {
    type: mongoose.Schema.ObjectId,
    required: true,
    index: true,
  },

  /*
  user_id: {
    type: mongoose.Schema.ObjectId,
    required: true,
  },
  */

  figure_line_bound_id: {
    type: mongoose.Schema.ObjectId,
    required: true,
  },

  timeframe: {
    type: String,
    required: true,
    enum: [...INTERVALS.values()],
  },

  number_trades: {
    type: Number,
    default: 1,
  },

  status: {
    type: Number,
    default: 0,
  },

  is_active: {
    type: Boolean,
    default: true,
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

/*
  Status:
  -> 0: strategy created, no limit and stop orders;
  -> 1: limit and stop orders are created;
  -> 2: limit order is triggered, have to create fractional-limit orders;
  3: some of fractional-limit order is triggered, if it's first have to change position of sl-order;
  4: last fractional-limit order is triggered, have to remove sl-order and finish strategy;
*/

const StrategyFigureLineRebound = new mongoose.Schema(modelSchema, { versionKey: false });

module.exports = mongoose.model(
  'StrategyFigureLineRebound',
  StrategyFigureLineRebound,
  'strategy-figure-line-rebounds',
);

module.exports.modelSchema = modelSchema;
