const mongoose = require('mongoose');

const User = new mongoose.Schema({
  fullname: {
    unique: true,
    type: String,
    required: true,
  },

  tradingview_user_id: {
    unique: true,
    type: String,
    required: true,
  },

  tradingview_chart_id: {
    type: String,
    required: true,
  },

  tradingview_session_id: {
    type: String,
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

module.exports = mongoose.model('User', User, 'users');
