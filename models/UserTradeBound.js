const mongoose = require('mongoose');

const {
  TYPES_EXIT,
  TYPES_TRADES,
} = require('../controllers/user-trade-bounds/constants');

const {
  STRATEGIES,
} = require('../controllers/strategies/constants');

const typesExit = [...TYPES_EXIT.values()];
const typesTrades = [...TYPES_TRADES.values()];

const strategies = [...STRATEGIES.values()];

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

  user_binance_bound_id: {
    type: mongoose.Schema.ObjectId,
    required: true,
  },

  strategy_name: {
    type: String,
    required: true,
    enum: strategies,
  },

  strategy_target_id: {
    type: mongoose.Schema.ObjectId,
    required: true,
  },

  type_trade: {
    type: String,
    required: true,
    enum: typesTrades,
  },

  type_exit: {
    type: String,
    enum: typesExit,
  },

  binance_trade_id: {
    type: String,
  },

  my_binance_trade_id: {
    unique: true,
    type: String,
    required: true,
  },

  buy_price: {
    type: Number,
  },

  sell_price: {
    type: Number,
  },

  trigger_price: {
    type: Number,
  },

  stoploss_price: {
    type: Number,
  },

  takeprofit_price: {
    type: Number,
  },

  stoploss_percent: {
    type: Number,
  },

  takeprofit_percent: {
    type: Number,
  },

  sum_commission: {
    type: Number,
  },

  quantity: {
    type: Number,
    required: true,
  },

  /*
  number_trades: {
    type: Number,
    default: 1,
  },
  */

  is_long: {
    type: Boolean,
    required: true,
  },

  is_active: {
    type: Boolean,
    required: true,
  },

  trade_started_at: {
    type: Date,
  },

  trade_ended_at: {
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

const UserTradeBound = new mongoose.Schema(modelSchema, { versionKey: false });

module.exports = mongoose.model('UserTradeBound', UserTradeBound, 'user-trade-bounds');
module.exports.modelSchema = modelSchema;
