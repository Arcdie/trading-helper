const loadDailyKlines = require('./load-daily-klines');
const createCandlesUsingDailyFiles = require('./create-candles-using-daily-files');

const addVolumeToCandles = require('./add-volume-to-candles');

module.exports = () => {
  // loadDailyKlines();
  // createCandlesUsingDailyFiles();

  addVolumeToCandles();
};
