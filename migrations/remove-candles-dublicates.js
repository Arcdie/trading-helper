const {
  getUnix,
} = require('../libs/support');

const Candle1m = require('../models/Candle-1m');
const InstrumentNew = require('../models/InstrumentNew');

module.exports = async () => {
  return;
  console.time('migration');
  console.log('Migration started');

  const instrumentsDocs = await InstrumentNew.find({
    is_active: true,
    is_futures: false,
  }, { name: 1 }).exec();

  for await (const doc of instrumentsDocs) {
    const candlesDocs = await Candle1m.find({
      instrument_id: doc._id,
    }, { time: 1 }).exec();

    const arrDublicatesIds = [];
    const lCandles = candlesDocs.length;

    for (let i = 0; i < lCandles; i += 1) {
      const targetCandleTimeUnix = getUnix(candlesDocs[i].time);

      for (let j = i + 1; j < lCandles; j += 1) {
        const candleTimeUnix = getUnix(candlesDocs[j].time);

        if (targetCandleTimeUnix === candleTimeUnix) {
          arrDublicatesIds.push(candlesDocs[j]._id);
        }
      }
    }

    await Candle1m.deleteMany({ _id: { $in: arrDublicatesIds } }).exec();
    console.log(doc.name, arrDublicatesIds.length);
  }

  console.timeEnd('migration');
};
