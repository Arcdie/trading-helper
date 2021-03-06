const mongoose = require('mongoose');

const modelSchema = {
  instrument_id: {
    type: mongoose.Schema.ObjectId,
    required: true,
    index: true,
  },

  quantity: {
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

  created_at: {
    type: Date,
    required: true,
    default: Date.now,
  },
};

const InstrumentRobotBound = new mongoose.Schema(modelSchema, { versionKey: false });

module.exports = mongoose.model('InstrumentRobotBound', InstrumentRobotBound, 'instrument-robot-bounds');
module.exports.modelSchema = modelSchema;
