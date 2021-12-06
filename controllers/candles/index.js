const getCandles = require('./get-candles');

const clearCandlesInRedis = require('./clear-candles-in-redis');

module.exports = {
  getCandles,

  clearCandlesInRedis,
};
