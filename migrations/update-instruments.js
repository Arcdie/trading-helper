// # migration for primary downloading / updating instruments

const {
  uploadNewInstrumentsFromBinance,
} = require('../controllers/instruments/cron/utils/upload-new-instruments-from-binance');

const InstrumentNew = require('../models/InstrumentNew');

module.exports = async () => {
  // settings
  return;

  // logic
  console.time('migration');
  console.log('Migration started');

  const result = await uploadNewInstrumentsFromBinance();
  console.log('result', result);

  console.timeEnd('migration');
};
