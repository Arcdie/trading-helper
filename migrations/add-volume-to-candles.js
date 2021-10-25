const log = require('../libs/logger');

const {
  getQueue,
} = require('../libs/support');

const Candle = require('../models/Candle');

module.exports = async () => {
  return;
  console.time('migration');
  console.log('Migration started');

  const candlesDocs = await Candle.find({
    volume: null,
  }, { data: 1, volume: 1 }).exec();

  if (!candlesDocs || !candlesDocs.length) {
    console.timeEnd('migration');
    return true;
  }

  const queues = getQueue(candlesDocs, 1000);

  for (const queue of queues) {
    await Promise.all(queue.map(async doc => {
      doc.volume = doc.data[4];
      await doc.save();
    }));
  }

  console.timeEnd('migration');
};
