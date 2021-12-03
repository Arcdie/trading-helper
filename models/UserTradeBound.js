const mongoose = require('mongoose');

const {
  TYPES_EXIT,
  TYPES_TRADES,
} = require('../controllers/user-trade-bounds/constants');

const typesExit = [...TYPES_EXIT.values()];
const typesTrades = [...TYPES_TRADES.values()];

const UserTradeBound = new mongoose.Schema({
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

  type_trade: {
    type: String,
    required: true,
    enum: typesTrades,
  },

  type_exit: {
    type: String,
    enum: typesExit,
  },

  my_binance_trade_id: {
    unique: true,
    type: String,
    required: true,
  },

  binance_trade_id: String,
  binance_stoploss_trade_id: String,

  buy_price: Number,
  sell_price: Number,

  quantity: {
    type: Number,
    required: true,
  },

  is_test: {
    type: Boolean,
    required: true,
  },

  stoploss_price: Number,
  takeprofit_price: Number,

  stoploss_percent: Number,
  takeprofit_percent: Number,

  profit_step_size: Number,

  is_long: {
    type: Boolean,
    required: true,
  },

  is_active: {
    type: Boolean,
    required: true,
  },

  trade_started_at: Date,
  trade_ended_at: Date,

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

module.exports = mongoose.model('UserTradeBound', UserTradeBound, 'user-trade-bounds');
