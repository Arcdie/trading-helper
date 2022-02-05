const mongoose = require('mongoose');

const {
  DISTANCE_FROM_LEFT_SIDE,
  DISTANCE_FROM_RIGHT_SIDE,
} = require('../controllers/user-figure-level-bounds/constants');

const modelSchema = {
  fullname: {
    unique: true,
    type: String,
    required: true,
  },

  password: {
    type: String,
    required: true,
  },

  tradingview_user_id: {
    type: String,
  },

  tradingview_chart_id: {
    type: String,
  },

  tradingview_session_id: {
    type: String,
  },

  telegram_user_id: {
    type: String,
  },

  does_have_access: {
    type: Boolean,
    default: false,
  },

  figure_levels_settings: {
    distance_from_left_side: {
      type: Number,
      default: DISTANCE_FROM_LEFT_SIDE,
    },

    distance_from_right_side: {
      type: Number,
      default: DISTANCE_FROM_RIGHT_SIDE,
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
};

const User = new mongoose.Schema(modelSchema, { versionKey: false });

module.exports = mongoose.model('User', User, 'users');
module.exports.modelSchema = modelSchema;
