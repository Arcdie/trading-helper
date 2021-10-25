const log = require('../libs/logger');

const Candle = require('../models/Candle');

module.exports = async () => {
  // return;
  console.time('migration');
  console.log('Migration started');

  const candlesDocs = await Candle.find({}, { data: 1, volume: 1 }).exec();

  if (!candlesDocs || !candlesDocs.length) {
    console.timeEnd('migration');
    return true;
  }

  for (const doc of candlesDocs) {
    doc.volume = doc.data[4];
    await doc.save();
  }

  console.timeEnd('migration');
};
