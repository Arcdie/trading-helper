const Instrument = require('../models/Instrument');

module.exports = async () => {
  return;
  console.time('migration');
  console.log('Migration started');

  await Instrument.updateMany({}, {
    is_active: true,
    is_moderated: true,
    moderated_at: new Date(),
  });

  console.timeEnd('migration');
};
