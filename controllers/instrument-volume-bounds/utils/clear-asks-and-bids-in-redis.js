const moment = require('moment');

const log = require('../../../libs/logger');
const redis = require('../../../libs/redis');

const {
  LIMITER_RANGE_FOR_LIMIT_ORDERS,
  REMOVE_INACTIVE_LIMIT_ORDERS_AFTER,
} = require('../constants');

const InstrumentVolumeBound = require('../../../models/InstrumentVolumeBound');

const clearAsksAndBidsInRedis = async ({
  instrumentName,
}) => {
  if (!instrumentName) {
    return {
      status: false,
      message: 'No or invalid instrumentName',
    };
  }

  const nowTimeUnix = moment().startOf('minute').unix();

  const keyInstrument = `INSTRUMENT:${instrumentName}`;
  const keyInstrumentAsks = `INSTRUMENT:${instrumentName}:ASKS`;
  const keyInstrumentBids = `INSTRUMENT:${instrumentName}:BIDS`;

  let cacheInstrumentDoc = await redis.getAsync(keyInstrument);
  let cacheInstrumentAsks = await redis.getAsync(keyInstrumentAsks);
  let cacheInstrumentBids = await redis.getAsync(keyInstrumentBids);

  if (!cacheInstrumentDoc) {
    log.warn(`No cacheInstrumentDoc doc; instrumentName: ${instrumentName}`);
    return null;
  }

  cacheInstrumentDoc = JSON.parse(cacheInstrumentDoc);

  if (!cacheInstrumentAsks) {
    cacheInstrumentAsks = [];
  } else {
    cacheInstrumentAsks = JSON.parse(cacheInstrumentAsks);
  }

  if (!cacheInstrumentBids) {
    cacheInstrumentBids = [];
  } else {
    cacheInstrumentBids = JSON.parse(cacheInstrumentBids);
  }

  cacheInstrumentAsks.forEach(([
    price, quantity, timestamp,
  ]) => {
    let isRemove = false;

    if (Math.abs(timestamp - nowTimeUnix) > REMOVE_INACTIVE_LIMIT_ORDERS_AFTER) {
      isRemove = true;
    } // 2 hours

    const differenceBetweenPriceAndOrder = Math.abs(cacheInstrumentDoc.price - price);
    const percentPerPrice = 100 / (cacheInstrumentDoc.price / differenceBetweenPriceAndOrder);

    if (percentPerPrice > LIMITER_RANGE_FOR_LIMIT_ORDERS) {
      isRemove = true;
    }

    if (isRemove) {
      cacheInstrumentAsks = cacheInstrumentAsks.filter(elem => elem[0] !== price);
    }
  });

  cacheInstrumentBids.forEach(([
    price, quantity, timestamp,
  ]) => {
    let isRemove = false;

    if (Math.abs(timestamp - nowTimeUnix) > REMOVE_INACTIVE_LIMIT_ORDERS_AFTER) {
      isRemove = true;
    } // 2 hours

    const differenceBetweenPriceAndOrder = Math.abs(cacheInstrumentDoc.price - price);
    const percentPerPrice = 100 / (cacheInstrumentDoc.price / differenceBetweenPriceAndOrder);

    if (percentPerPrice > LIMITER_RANGE_FOR_LIMIT_ORDERS) {
      isRemove = true;
    }

    if (isRemove) {
      cacheInstrumentBids = cacheInstrumentBids.filter(elem => elem[0] !== price);
    }
  });

  await redis.setAsync([
    `INSTRUMENT:${instrumentName}:ASKS`,
    JSON.stringify(cacheInstrumentAsks),
  ]);

  await redis.setAsync([
    `INSTRUMENT:${instrumentName}:BIDS`,
    JSON.stringify(cacheInstrumentBids),
  ]);

  return {
    status: true,
  };
};

module.exports = {
  clearAsksAndBidsInRedis,
};
