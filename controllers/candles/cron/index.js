const clearCandles = require('./clear-candles');
const checkCandles = require('./check-candles');
const calculateCandles = require('./calculate-candles');
const create1mCandlesForLastHour = require('./create-1m-candles-for-last-hour');

module.exports = {
  clearCandles,
  checkCandles,
  calculateCandles,
  create1mCandlesForLastHour,
};
