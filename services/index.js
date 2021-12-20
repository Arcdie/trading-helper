const redis = require('../libs/redis');
const log = require('../libs/logger')(module);

const memoryUsage = require('./memory-usage');
const binanceScreenerProcesses = require('./binance-screener');

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

const {
  getActiveInstruments,
} = require('../controllers/instruments/utils/get-active-instruments');

module.exports = async () => {
  try {
    // await redis.flushallAsync();

    const resultGetInstruments = await getActiveInstruments({});

    if (!resultGetInstruments || !resultGetInstruments.status) {
      log.warn(resultGetInstruments.message || 'Cant getActiveInstruments');
      return false;
    }

    const instrumentsDocs = resultGetInstruments.result || [];

    if (!instrumentsDocs || !instrumentsDocs.length) {
      return true;
    }

    /*
    await redis.setAsync([
      'ACTIVE_INSTRUMENTS',
      JSON.stringify(instrumentsDocs.map(doc => ({
        is_futures: doc.is_futures,
        instrument_id: doc._id.toString(),
      }))),
    ]);
    */

    if (process.env.NODE_ENV !== 'localhost') {
      await clearSocketsInRedis({});
      // await clearCandlesInRedis({});

      await Promise.all(instrumentsDocs.map(async doc => {
        const key = `INSTRUMENT:${doc.name}`;
        const cacheDoc = await redis.getAsync(key);

        if (!cacheDoc) {
          await redis.setAsync([key, JSON.stringify(doc)]);
          await redis.setAsync([`INSTRUMENT:${doc._id.toString()}:NAME`, doc.name]);
        }

        return null;
      }));

      // update price for instrument in database
      await intervalUpdateInstrument(instrumentsDocs, 5 * 60 * 1000); // 5 minutes
    }

    await createWebsocketRooms(instrumentsDocs);
    await binanceScreenerProcesses();

    // check memory
    // /*
    setInterval(() => {
      memoryUsage();
    }, 10 * 1000); // 10 seconds
    // */
  } catch (error) {
    log.error(error.message);
    return false;
  }
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
