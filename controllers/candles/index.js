const nextTick = require('./next-tick');
const getCandles = require('./get-candles');

const clearCandlesInRedis = require('./clear-candles-in-redis');

module.exports = {
  nextTick,
  getCandles,

  clearCandlesInRedis,
};
