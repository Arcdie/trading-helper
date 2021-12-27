const mongoose = require('mongoose');

const {
  modelSchema,
} = require('./UserTradeBound');

const UserTradeBoundTest = new mongoose.Schema(modelSchema, { versionKey: false });

module.exports = mongoose.model('UserTradeBoundTest', UserTradeBoundTest, 'user-trade-bounds_test');
module.exports.modelSchema = modelSchema;
