const updateBinanceData = require('./update-binance-data');

const calculateAverageVolumeForLastDay = require('./calculate-average-volume-for-last-day');
const calculateAverageVolumeForLast15Minutes = require('./calculate-average-volume-for-last-15-minutes');

module.exports = {
  updateBinanceData,

  calculateAverageVolumeForLastDay,
  calculateAverageVolumeForLast15Minutes,
};
