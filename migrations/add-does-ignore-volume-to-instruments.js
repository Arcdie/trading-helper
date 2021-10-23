const InstrumentNew = require('../models/InstrumentNew');

module.exports = async () => {
  return;
  console.time('migration');
  console.log('Migration started');

  await InstrumentNew.updateMany({}, {
    does_ignore_volume: false,
  });

  console.timeEnd('migration');
};
