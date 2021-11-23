const InstrumentNew = require('../models/InstrumentNew');
const InstrumentTrend = require('../models/InstrumentTrend');

module.exports = async () => {
  return;
  console.time('migration');
  console.log('Migration started');

  const instrumentsDocs = await InstrumentNew.find({}, { _id: 1 }).exec();

  if (!instrumentsDocs || !instrumentsDocs.length) {
    console.timeEnd('migration');
    return true;
  }

  await Promise.all(instrumentsDocs.map(async doc => {
    const newInstrumentTrend = new InstrumentTrend({
      instrument_id: doc._id,
    });

    await newInstrumentTrend.save();
  }));

  console.timeEnd('migration');
};
