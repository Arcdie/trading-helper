const clearCandles = require('./clear-candles');
const calculateCandles = require('./calculate-candles');

const hourlyCheck1mCandles = require('./hourly-check-1m-candles');
const hourlyCheck5mCandles = require('./hourly-check-5m-candles');
const dailyCheck5mCandles = require('./daily-check-5m-candles');

const dailyCheck1mCandles = require('./daily-check-1m-candles');
const create1mCandlesForLastHour = require('./create-1m-candles-for-last-hour');

module.exports = {
  clearCandles,
  calculateCandles,

  hourlyCheck1mCandles,
  hourlyCheck5mCandles,
  dailyCheck5mCandles,

  // deprecated
  dailyCheck1mCandles,
  create1mCandlesForLastHour,
};
