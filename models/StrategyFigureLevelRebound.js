const mongoose = require('mongoose');

const modelSchema = {
  instrument_id: {
    type: mongoose.Schema.ObjectId,
    required: true,
    index: true,
  },

  figure_level_bound_id: {
    type: mongoose.Schema.ObjectId,
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

const StrategyFigureLevelRebound = new mongoose.Schema(modelSchema, { versionKey: false });

module.exports = mongoose.model(
  'StrategyFigureLevelRebound',
  StrategyFigureLevelRebound,
  'strategy-figure-level-rebounds',
);

module.exports.modelSchema = modelSchema;
