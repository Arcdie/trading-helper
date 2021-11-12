const mongoose = require('mongoose');

const UserTradeBound = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.ObjectId,
    required: true,
  },

  instrument_id: {
    type: mongoose.Schema.ObjectId,
    required: true,
  },

  user_binance_bound_id: {
    type: mongoose.Schema.ObjectId,
    required: true,
  },

  binance_trade_id: {
    unique: true,
    type: String,
    required: true,
  },

  binance_stoploss_trade_id: String,

  buy_price: Number,
  sell_price: Number,

  quantity: {
    type: Number,
    required: true,
  },

  stoploss_price: Number,
  stoploss_percent: Number,
  takeprofit_price: Number,
  profit_step_size: Number,

  is_long: {
    type: Boolean,
    required: true,
  },

  is_active: {
    type: Boolean,
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
}, { versionKey: false });

module.exports = mongoose.model('UserTradeBound', UserTradeBound, 'user-trade-bounds');
