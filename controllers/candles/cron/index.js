const clearCandles = require('./clear-candles');
const calculateCandles = require('./calculate-candles');

const hourlyCheck1mCandles = require('./hourly-check-1m-candles');
const hourlyCheck5mCandles = require('./hourly-check-5m-candles');
const hourlyCheck1hCandles = require('./hourly-check-1h-candles');

const dailyCheck1mCandles = require('./daily-check-1m-candles');
const dailyCheck5mCandles = require('./daily-check-5m-candles');
const dailyCheck1hCandles = require('./daily-check-1h-candles');

const create1mCandlesForLastHour = require('./create-1m-candles-for-last-hour');
// const create1hCandlesForLastHour = require('./create-1h-candles-for-last-hour');

module.exports = {
  clearCandles,
  calculateCandles,

  hourlyCheck1mCandles,
  hourlyCheck5mCandles,
  hourlyCheck1hCandles,

  dailyCheck1mCandles,
  dailyCheck5mCandles,
  dailyCheck1hCandles,

  // deprecated
  create1mCandlesForLastHour,
};
