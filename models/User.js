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
