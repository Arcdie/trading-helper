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
  DOCS_LIMITER_FOR_QUEUES,
} = require('../controllers/instruments/constants');

const InstrumentNew = require('../models/InstrumentNew');

module.exports = async () => {
  const instrumentsDocs = await InstrumentNew.find({
    // tmp
    // name: {
    //   $in: ['IOTXUSDTPERP'],
    // },
    //
    is_futures: true,

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

  // check memory
  setInterval(() => {
    memoryUsage();
  }, 10 * 1000); // 10 seconds

  // update average volume per 15 minutes
  await intervalUpdateAverageVolume(instrumentsDocs, 5 * 60 * 1000); // 5 minutes

  // update price for instrument in database
  await intervalUpdateInstrument(instrumentsDocs, 1 * 60 * 1000); // 1 minute
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
