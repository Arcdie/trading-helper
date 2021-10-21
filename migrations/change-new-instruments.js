const InstrumentNew = require('../models/InstrumentNew');

module.exports = async () => {
  return;
  console.time('migration');
  console.log('Migration started');

  const instrumentsSpotDocs = await InstrumentNew.find({
    is_active: true,
    is_futures: false,
  }).exec();

  const instrumentsFuturesDocs = await InstrumentNew.find({
    is_active: true,
    is_futures: true,
  }).exec();

  await Promise.all(instrumentsFuturesDocs.map(async futDoc => {
    const doesExistSpot = instrumentsSpotDocs.find(
      spotDoc => spotDoc.name === futDoc.name.replace('PERP', ''),
    );

    if (!doesExistSpot) {
      // spotDoc.is_active = false;
      // await spotDoc.save();
    }
  }));

  console.timeEnd('migration');
};
