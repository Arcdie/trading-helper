const moment = require('moment');

const log = require('../../libs/logger');
const redis = require('../../libs/redis');

const {
  updateInstrument,
} = require('../../controllers/instruments/utils/update-instrument');

const {
  updateAverageVolume,
} = require('../../controllers/instruments/utils/update-average-volume');

const {
  checkInstrumentVolumeBounds,
} = require('../../controllers/instrument-volume-bounds/utils/check-instrument-volume-bounds');

const getTicksForSpotInstruments = require('./spot/get-ticks-for-spot-instruments');
const getPricesForSpotInstruments = require('./spot/get-prices-for-spot-instruments');
const getLimitOrdersForSpotInstruments = require('./spot/get-limit-orders-for-spot-instruments');

const getTicksForFuturesInstruments = require('./futures/get-ticks-for-futures-instruments');
const getPricesForFuturesInstruments = require('./futures/get-prices-for-futures-instruments');
const getLimitOrdersForFuturesInstruments = require('./futures/get-limit-orders-for-futures-instruments');

const InstrumentNew = require('../../models/InstrumentNew');

module.exports = async () => {
  const instrumentsDocs = await InstrumentNew.find({
    // tmp
    name: 'ADAUSDTPERP',

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

  const futuresDocs = instrumentsDocs
    .filter(doc => doc.is_futures).map(doc => doc._doc);

  const spotDocs = instrumentsDocs
    .filter(doc => !doc.is_futures).map(doc => doc._doc);

  /* set websocket connections */
  // await getTicksForSpotInstruments(spotDocs);
  // await getPricesForSpotInstruments(spotDocs);
  // await getLimitOrdersForSpotInstruments(spotDocs);

  await getTicksForFuturesInstruments(futuresDocs);
  // await getPricesForFuturesInstruments(futuresDocs);
  await getLimitOrdersForFuturesInstruments(futuresDocs);
  /* end */

  // update average volume per 15 minutes
  setInterval(async () => {
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
  }, 5 * 60 * 1000); // 5 minutes

  // check volume bounds
  setInterval(async () => {
    await Promise.all(instrumentsDocs.map(async doc => {
      await checkInstrumentVolumeBounds({
        instrumentId: doc._id,
        instrumentName: doc.name,
      });
    }));
  }, 10 * 1000); // 10 seconds

  // update price for instrument in database
  setInterval(async () => {
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
  }, 60 * 1000); // 1 minute;
};
