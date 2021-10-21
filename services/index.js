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
  updateAverageVolume,
} = require('../controllers/instruments/utils/update-average-volume');

const {
  checkInstrumentVolumeBounds,
} = require('../controllers/instrument-volume-bounds/utils/check-instrument-volume-bounds');

const {
  clearAsksAndBidsInRedis,
} = require('../controllers/instrument-volume-bounds/utils/clear-asks-and-bids-in-redis');

const {
  DOCS_LIMITER_FOR_QUEUES,
} = require('../controllers/instruments/constants');

const InstrumentNew = require('../models/InstrumentNew');

module.exports = async () => {
  const instrumentsDocs = await InstrumentNew.find({
    // tmp
    // name: 'ADAUSDTPERP',

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

  memoryUsage();

  // check memory
  setInterval(() => {
    memoryUsage();
  }, 10 * 1000); // 10 seconds

  // update average volume per 15 minutes
  // await intervalUpdateAverageVolume(instrumentsDocs, 5 * 60 * 1000); // 5 minutes

  // check volume bounds
  // await intervalCheckInstrumentVolumeBounds(instrumentsDocs, 10 * 1000); // 10 seconds

  // update price for instrument in database
  // await intervalUpdateInstrument(instrumentsDocs, 1 * 60 * 1000); // 1 minute

  // clear old bids and asks
  // await intervalClearAsksAndBidsInRedis(instrumentsDocs, 60 * 60 * 1000); // 1 hour
};

const intervalUpdateAverageVolume = async (instrumentsDocs = [], interval) => {
  console.log('update average volume per 15 minutes');

  const nowTime = moment().startOf('minute');
  const nowMinites = nowTime.minutes();

  const remainder = nowMinites / 5;
  const startTimeCurrent5MSeries = moment(nowTime).add(-remainder.minutes, 'minutes');
  const startTime15MSeries = moment(startTimeCurrent5MSeries).add(-15, 'minutes').unix();

  let targetTimestamp = startTime15MSeries;
  const arrSeries = [targetTimestamp];

  for (let i = 0; i < 14; i += 1) {
    targetTimestamp += 60;
    arrSeries.push(targetTimestamp);
  }

  await Promise.all(instrumentsDocs.map(async doc => {
    await updateAverageVolume({
      instrumentId: doc._id,
      instrumentName: doc.name,

      arrSeries,
    });
  }));

  setTimeout(() => {
    intervalUpdateAverageVolume(instrumentsDocs, interval);
  }, interval);

  return true;
};

const intervalCheckInstrumentVolumeBounds = async (instrumentsDocs = [], interval) => {
  console.log('check volume bounds');

  const queues = getQueue(instrumentsDocs, DOCS_LIMITER_FOR_QUEUES);
  const lQueues = queues.length;

  await (async () => {
    for (let i = 0; i < lQueues; i += 1) {
      const targetInstrumentsDocs = queues[i];

      await Promise.all(targetInstrumentsDocs.map(async doc => {
        await checkInstrumentVolumeBounds({
          instrumentId: doc._id,
          instrumentName: doc.name,
        });
      }));
    }
  })();

  setTimeout(() => {
    intervalCheckInstrumentVolumeBounds(instrumentsDocs, interval);
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

const intervalClearAsksAndBidsInRedis = async (instrumentsDocs = [], interval) => {
  console.log('clear old bids and asks');

  const queues = getQueue(instrumentsDocs, DOCS_LIMITER_FOR_QUEUES);
  const lQueues = queues.length;

  await (async () => {
    for (let i = 0; i < lQueues; i += 1) {
      const targetInstrumentsDocs = queues[i];

      await Promise.all(targetInstrumentsDocs.map(async doc => {
        clearAsksAndBidsInRedis({
          instrumentName: doc.name,
        });
      }));
    }
  })();

  setTimeout(() => {
    intervalClearAsksAndBidsInRedis(instrumentsDocs, interval);
  }, interval);
};
