const mongoose = require('mongoose');

const {
  TYPES_TRENDS,
} = require('../controllers/instrument-trends/constants');

const typesTrends = [...TYPES_TRENDS.values()];

const InstrumentTrend = new mongoose.Schema({
  instrument_id: {
    type: mongoose.Schema.ObjectId,
    required: true,
    unique: true,
  },

  micro_trend_for_1m_timeframe: {
    type: String,
    enum: typesTrends,
    default: TYPES_TRENDS.get('flat'),
  },

  macro_trend_for_1m_timeframe: {
    type: String,
    enum: typesTrends,
    default: TYPES_TRENDS.get('flat'),
  },

  micro_trend_for_5m_timeframe: {
    type: String,
    enum: typesTrends,
    default: TYPES_TRENDS.get('flat'),
  },

  macro_trend_for_5m_timeframe: {
    type: String,
    enum: typesTrends,
    default: TYPES_TRENDS.get('flat'),
  },

  micro_trend_for_1h_timeframe: {
    type: String,
    enum: typesTrends,
    default: TYPES_TRENDS.get('flat'),
  },

  macro_trend_for_1h_timeframe: {
    type: String,
    enum: typesTrends,
    default: TYPES_TRENDS.get('flat'),
  },

  micro_trend_for_4h_timeframe: {
    type: String,
    enum: typesTrends,
    default: TYPES_TRENDS.get('flat'),
  },

  macro_trend_for_4h_timeframe: {
    type: String,
    enum: typesTrends,
    default: TYPES_TRENDS.get('flat'),
  },

  micro_trend_for_1d_timeframe: {
    type: String,
    enum: typesTrends,
    default: TYPES_TRENDS.get('flat'),
  },

  macro_trend_for_1d_timeframe: {
    type: String,
    enum: typesTrends,
    default: TYPES_TRENDS.get('flat'),
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

module.exports = mongoose.model('InstrumentTrend', InstrumentTrend, 'instrument-trends');
