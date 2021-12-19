const mongoose = require('mongoose');

const modelSchema = {
  instrument_id: {
    type: mongoose.Schema.ObjectId,
    required: true,
    index: true,
  },

  is_long: {
    type: Boolean,
    required: true,
  },

  price: {
    type: Number,
    required: true,
  },

  factor: {
    type: Number,
    required: true,
  },

  candles_average_volume: {
    type: Number,
    required: true,
  },

  candle_time: {
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

const StrategyPriceJump = new mongoose.Schema(modelSchema, { versionKey: false });

module.exports = mongoose.model('StrategyPriceJump', StrategyPriceJump, 'strategy-price-jumps');
module.exports.modelSchema = modelSchema;
