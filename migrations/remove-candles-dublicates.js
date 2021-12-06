const moment = require('moment');

const {
  getUnix,
} = require('../libs/support');

const Candle1m = require('../models/Candle-1m');
const Candle5m = require('../models/Candle-5m');
const InstrumentNew = require('../models/InstrumentNew');

module.exports = async () => {
  return;
  console.time('migration');
  console.log('Migration started');

  const instrumentsDocs = await InstrumentNew.find({
    is_active: true,
    // is_futures: false,
  }, { name: 1 }).exec();

  const startDate = moment('2021-12-05 00:00:00.000Z').utc();
  const endDate = moment('2021-12-05 16:00:00.000Z').utc();

  for await (const doc of instrumentsDocs) {
    const fetchPromises = [
      Candle1m.find({
        instrument_id: doc._id,

        $and: [{
          time: { $gte: startDate },
        }, {
          time: { $lt: endDate },
        }],
      }, { time: 1 }).exec(),

      Candle5m.find({
        instrument_id: doc._id,

        $and: [{
          time: { $gte: startDate },
        }, {
          time: { $lt: endDate },
        }],
      }, { time: 1 }).exec(),
    ];

    const [
      candles1mDocs,
      candles5mDocs,
    ] = await Promise.all(fetchPromises);

    const arrDublicates1mIds = [];
    const arrDublicates5mIds = [];
    const lCandles1m = candles1mDocs.length;
    const lCandles5m = candles5mDocs.length;

    for (let i = 0; i < lCandles1m; i += 1) {
      const targetCandleTimeUnix = getUnix(candles1mDocs[i].time);

      for (let j = i + 1; j < lCandles1m; j += 1) {
        if (!candles1mDocs[j]) {
          break;
        }

        const candleTimeUnix = getUnix(candles1mDocs[j].time);

        if (targetCandleTimeUnix === candleTimeUnix) {
          arrDublicates1mIds.push(candles1mDocs[j]._id);
        }
      }
    }

    for (let i = 0; i < lCandles5m; i += 1) {
      const targetCandleTimeUnix = getUnix(candles5mDocs[i].time);

      for (let j = i + 1; j < lCandles1m; j += 1) {
        if (!candles5mDocs[j]) {
          break;
        }

        const candleTimeUnix = getUnix(candles5mDocs[j].time);

        if (targetCandleTimeUnix === candleTimeUnix) {
          arrDublicates5mIds.push(candles5mDocs[j]._id);
        }
      }
    }

    console.log(doc.name, arrDublicates1mIds.length);
    console.log(doc.name, arrDublicates5mIds.length);

    if (arrDublicates1mIds.length) {
      await Candle1m.deleteMany({ _id: { $in: arrDublicates1mIds } }).exec();
    }

    if (arrDublicates5mIds.length) {
      await Candle5m.deleteMany({ _id: { $in: arrDublicates5mIds } }).exec();
    }

    console.log('Ended', doc.name);
  }

  console.timeEnd('migration');
};
