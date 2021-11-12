const mongoose = require('mongoose');

const UserBinanceBound = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.ObjectId,
    required: true,
  },

  apikey: {
    type: String,
    required: true,
  },

  secret: {
    type: String,
    required: true,
  },

  listen_key: String,
  listen_key_updated_at: Date,

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
}, { versionKey: false });

module.exports = mongoose.model('UserBinanceBound', UserBinanceBound, 'user-binance-bounds');
