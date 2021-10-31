const moment = require('moment');

const log = require('../libs/logger');
const redis = require('../libs/redis');

const memoryUsage = require('./memory-usage');
const binanceProcesses = require('./binance');

const {
  createWebsocketRooms,
} = require('../websocket/websocket-server');

const {
  sleep,
} = require('../libs/support');

const {
  updateInstrument,
} = require('../controllers/instruments/utils/update-instrument');

const {
  updateAverageVolume,
} = require('../controllers/instruments/utils/update-average-volume');

const {
  calculate1hCandle,
} = require('../controllers/candles/utils/calculate-1h-candle');

const {
  calculate4hCandle,
} = require('../controllers/candles/utils/calculate-4h-candle');

const {
  calculate1dCandle,
} = require('../controllers/candles/utils/calculate-1d-candle');

const {
  DOCS_LIMITER_FOR_QUEUES,
} = require('../controllers/instruments/constants');

const InstrumentNew = require('../models/InstrumentNew');

module.exports = async () => {
  await redis.flushallAsync();

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
  await createWebsocketRooms(instrumentsDocs);

  const nowTimeUnix = moment().unix();
  const startCurrentDayUnix = moment().startOf('day').unix();
  const startNextDayUnix = startCurrentDayUnix + 86400;
  const differenceBetweenNowAndTomorrow = startNextDayUnix - nowTimeUnix;
  const differenceBetweenNowAndStartToday = nowTimeUnix - startCurrentDayUnix;

  const secondsBeforeNext1HInterval = 3600 - (nowTimeUnix % 3600);
  const secondsBeforeNext4HInterval = 14400 - (differenceBetweenNowAndStartToday % 14400); // 14400 = 86400 (day) / 6 (count 4)

  // check memory
  /*
  setInterval(() => {
    memoryUsage();
  }, 10 * 1000); // 10 seconds
  */

  // update price for instrument in database
  await intervalUpdateInstrument(instrumentsDocs, 1 * 60 * 1000); // 1 minute

  setTimeout(async () => {
    // save 1h candles
    await intervaCalculate1hCandles(instrumentsDocs, 1 * 60 * 60 * 1000); // 1 hour
  }, secondsBeforeNext1HInterval * 1000);

  setTimeout(async () => {
    // save 4h candles
    await intervalCalculate4hCandles(instrumentsDocs, 4 * 60 * 60 * 1000); // 4 hours
  }, secondsBeforeNext4HInterval * 1000);

  setTimeout(async () => {
    // save 1d candles
    await intervalCalculate1dCandles(instrumentsDocs, 24 * 60 * 60 * 1000); // 24 hours
  }, differenceBetweenNowAndTomorrow * 1000);

  setTimeout(async () => {
    // update average volume
    await intervalUpdateAverageVolume(
      instrumentsDocs.filter(doc => !doc.does_ignore_volume),
      24 * 60 * 60 * 1000, // 24 hours
    );
  }, differenceBetweenNowAndTomorrow * 1000);
};

const intervaCalculate1hCandles = async (instrumentsDocs, interval) => {
  console.log('calculate 1h candles');

  setTimeout(() => {
    intervaCalculate1hCandles(instrumentsDocs, interval);
  }, interval);
};

const intervalCalculate4hCandles = async (instrumentsDocs, interval) => {
  console.log('calculate 4h candles');

  setTimeout(() => {
    intervalCalculate4hCandles(instrumentsDocs, interval);
  }, interval);
};

const intervalCalculate1dCandles = async (instrumentsDocs, interval) => {
  console.log('calculate 1d candles');

  setTimeout(() => {
    intervalCalculate1dCandles(instrumentsDocs, interval);
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
