const log = require('../libs/logger');
const redis = require('../libs/redis');

const memoryUsage = require('./memory-usage');
const binanceProcesses = require('./binance');

const {
  createWebsocketRooms,
} = require('../websocket/websocket-server');

const {
  clearSocketsInRedis,
} = require('../controllers/users/utils/clear-sockets-in-redis');

const {
  clearCandlesInRedis,
} = require('../controllers/candles/utils/clear-candles-in-redis');

const {
  updateInstrument,
} = require('../controllers/instruments/utils/update-instrument');

const InstrumentNew = require('../models/InstrumentNew');

module.exports = async () => {
  // await redis.flushallAsync();

  if (process.env.NODE_ENV !== 'localhost') {
    await clearSocketsInRedis({});
    await clearCandlesInRedis({});
  }

  const instrumentsDocs = await InstrumentNew.find({
    is_active: true,
  }).exec();

  /*
  await redis.setAsync([
    'ACTIVE_INSTRUMENTS',
    JSON.stringify(instrumentsDocs.map(doc => ({
      is_futures: doc.is_futures,
      instrument_id: doc._id.toString(),
    }))),
  ]);
  */

  await Promise.all(instrumentsDocs.map(async doc => {
    const key = `INSTRUMENT:${doc.name}`;
    const cacheDoc = await redis.getAsync(key);

    if (!cacheDoc) {
      await redis.setAsync([key, JSON.stringify(doc._doc)]);
      await redis.setAsync([`INSTRUMENT:${doc._id.toString()}:NAME`, doc.name]);
    }

    return null;
  }));

  await binanceProcesses(instrumentsDocs);
  await createWebsocketRooms(instrumentsDocs);

  // check memory
  /*
  setInterval(() => {
    memoryUsage();
  }, 10 * 1000); // 10 seconds
  */

  // update price for instrument in database
  await intervalUpdateInstrument(instrumentsDocs, 1 * 60 * 1000); // 1 minute
};

const intervalUpdateInstrument = async (instrumentsDocs = [], interval) => {
  // console.log('update price for instrument in database');

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
