const clearCandles = require('./clear-candles');
const check1mCandles = require('./check-1m-candles');
const check5mCandles = require('./check-5m-candles');
const calculateCandles = require('./calculate-candles');
const create1mCandlesForLastHour = require('./create-1m-candles-for-last-hour');

module.exports = {
  clearCandles,
  check1mCandles,
  check5mCandles,
  calculateCandles,
  create1mCandlesForLastHour,
};
