const mongoose = require('mongoose');

const {
  DEFAULT_INDENT_IN_PERCENTS,
} = require('../controllers/user-level-bounds/constants');

const User = new mongoose.Schema({
  fullname: {
    unique: true,
    type: String,
    required: true,
  },

  password: {
    type: String,
    required: true,
  },

  tradingview_user_id: String,
  tradingview_chart_id: String,
  tradingview_session_id: String,

  telegram_user_id: String,

  settings: {
    is_bounded_telegram: {
      type: Boolean,
      default: false,
    },

    indent_in_percents: {
      type: Number,
      default: DEFAULT_INDENT_IN_PERCENTS,
    },
  },

  levels_monitoring_settings: {
    is_draw_levels_for_1h_candles: {
      type: Boolean,
      default: false,
    },

    is_draw_levels_for_4h_candles: {
      type: Boolean,
      default: false,
    },

    is_draw_levels_for_1d_candles: {
      type: Boolean,
      default: false,
    },

    number_candles_for_calculate_1h_levels: {
      type: Number,
      default: 10,
    },

    number_candles_for_calculate_4h_levels: {
      type: Number,
      default: 10,
    },

    number_candles_for_calculate_1d_levels: {
      type: Number,
      default: 10,
    },
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

  /* DEPRECATED
    tradingview_list_id: String,
  */
}, { versionKey: false });

module.exports = mongoose.model('User', User, 'users');
