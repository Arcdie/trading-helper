const mongoose = require('mongoose');

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

  price: {
    type: Number,
    required: true,
  },

  is_long: {
    type: Boolean,
    required: true,
  },

  is_active: {
    type: Boolean,
    default: true,
  },

  worked_at: {
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

const UserNotification = new mongoose.Schema(modelSchema, { versionKey: false });

module.exports = mongoose.model('UserNotification', UserNotification, 'user-notifications');
module.exports.modelSchema = modelSchema;
