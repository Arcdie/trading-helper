const mongoose = require('mongoose');

const {
  modelSchema,
} = require('./UserTradeBound');

const UserTradeBoundStatistics = new mongoose.Schema(modelSchema, { versionKey: false });

module.exports = mongoose.model('UserTradeBoundStatistics', UserTradeBoundStatistics, 'user-trade-bounds_statistics');
module.exports.modelSchema = modelSchema;
