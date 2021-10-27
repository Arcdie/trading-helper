const moment = require('moment');

const log = require('../libs/logger');
const redis = require('../libs/redis');

const memoryUsage = require('./memory-usage');
const binanceProcesses = require('./binance');

const {
  sleep,
  getQueue,
} = require('../libs/support');

const {
  updateInstrument,
} = require('../controllers/instruments/utils/update-instrument');

const {
  calculate1hCandle,
} = require('../controllers/candles/utils/calculate-1h-candle');

const {
  updateAverageVolume,
} = require('../controllers/instruments/utils/update-average-volume');

const {
  checkInstrumentVolumeBounds,
} = require('../controllers/instrument-volume-bounds/utils/check-instrument-volume-bounds');

const {
  DOCS_LIMITER_FOR_QUEUES,
} = require('../controllers/instruments/constants');

const Candle = require('../models/Candle');
const InstrumentNew = require('../models/InstrumentNew');

module.exports = async () => {
  const instrumentsDocs = await InstrumentNew.find({
    is_active: true,
  }).exec();

  await Promise.all(instrumentsDocs.map(async doc => {
    const key = `INSTRUMENT:${doc.name}`;
    const cacheDoc = await redis.getAsync(key);

    if (!cacheDoc) {
      await redis.setAsync([key, JSON.stringify(doc._doc)]);
    }

    return null;
  }));

  await binanceProcesses(instrumentsDocs);

  const nowTimeUnix = moment().unix();
  const startNextDayUnix = moment().add(1, 'days').startOf('day').unix();
  const differenceBetweenNowAndTomorrow = startNextDayUnix - nowTimeUnix;

  // check memory
  /*
  setInterval(() => {
    memoryUsage();
  }, 10 * 1000); // 10 seconds
  */

  // update price for instrument in database
  await intervalUpdateInstrument(instrumentsDocs, 1 * 60 * 1000); // 1 minute

  setTimeout(async () => {
    // update average volume
    await intervalUpdateAverageVolume(
      instrumentsDocs.filter(doc => !doc.does_ignore_volume),
      24 * 60 * 60 * 1000, // 24 hours
    );

    // create hour candles
    /*
    await intervalCreateHourCandles(
      instrumentsDocs.filter(doc => doc.is_futures && doc.name === 'RUNEUSDTPERP'),
      24 * 60 * 60 * 1000, // 24 hours
    );
    */
  }, differenceBetweenNowAndTomorrow * 1000);
};

const intervalCreateHourCandles = async (instrumentsDocs = [], interval) => {
  console.log('calculate hour candles');

  const startHourTime = moment().startOf('hour');
  const hourBeforeTime = moment(startHourTime).add(-1, 'hours');

  for (const doc of instrumentsDocs) {
    await calculate1hCandle({
      instrumentId: doc._id,
      startTime: startHourTime,
      endTime: hourBeforeTime,
    });
  }

  setTimeout(() => {
    intervalCreateHourCandles(instrumentsDocs, interval);
  }, interval);
};

const intervalUpdateAverageVolume = async (instrumentsDocs = [], interval) => {
  console.log('update average volume');

  await Promise.all(instrumentsDocs.map(async doc => {
    await updateAverageVolume({
      instrumentId: doc._id,
      instrumentName: doc.name,
    });
  }));

  setTimeout(() => {
    intervalUpdateAverageVolume(instrumentsDocs, interval);
  }, interval);
};

const intervalUpdateInstrument = async (instrumentsDocs = [], interval) => {
  console.log('update price for instrument in database');

  await Promise.all(instrumentsDocs.map(async doc => {
    const key = `INSTRUMENT:${doc.name}`;
    let cacheDoc = await redis.getAsync(key);

    if (!cacheDoc) {
      log.warn(`No cache doc; instrumentName: ${doc.name}`);
      return null;
    }

    cacheDoc = JSON.parse(cacheDoc);

    await updateInstrument({
      instrumentId: doc._id,
      price: parseFloat(cacheDoc.price),
    });
  }));

  setTimeout(() => {
    intervalUpdateInstrument(instrumentsDocs, interval);
  }, interval);
};
