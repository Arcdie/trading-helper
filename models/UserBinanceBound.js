const mongoose = require('mongoose');

const modelSchema = {
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

  listen_key: {
    type: String,
  },

  listen_key_updated_at: {
    type: Date,
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

const UserBinanceBound = new mongoose.Schema(modelSchema, { versionKey: false });

module.exports = mongoose.model('UserBinanceBound', UserBinanceBound, 'user-binance-bounds');
module.exports.modelSchema = modelSchema;
