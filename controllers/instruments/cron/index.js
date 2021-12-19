const updateBinanceData = require('./update-binance-data');
const checkInactiveInstruments = require('./check-inactive-instruments');
const uploadNewInstrumentsFromBinance = require('./upload-new-instruments-from-binance');

const calculateAverageVolumeForLastDay = require('./calculate-average-volume-for-last-day');
const calculateAverageVolumeForLast15Minutes = require('./calculate-average-volume-for-last-15-minutes');

module.exports = {
  updateBinanceData,
  checkInactiveInstruments,
  uploadNewInstrumentsFromBinance,

  calculateAverageVolumeForLastDay,
  calculateAverageVolumeForLast15Minutes,
};
