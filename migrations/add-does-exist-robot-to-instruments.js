const Instrument = require('../models/Instrument');

module.exports = async () => {
  return;
  console.time('migration');
  console.log('Migration started');

  await Instrument.updateMany({
    name_spot: {
      $in: ['UNIUSDT'],
    },
  }, {
    does_exist_robot: true,
    tick_sizes_for_robot: [{
      value: 500,
      direction: 'long',
    }],
  });

  console.timeEnd('migration');
};
