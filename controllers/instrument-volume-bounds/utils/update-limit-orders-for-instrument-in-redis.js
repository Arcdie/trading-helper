const moment = require('moment');

const log = require('../../../libs/logger');
const redis = require('../../../libs/redis');

const {
  LIMITER_RANGE_FOR_LIMIT_ORDERS,
  REMOVE_INACTIVE_LIMIT_ORDERS_AFTER,
} = require('../constants');

const InstrumentNew = require('../../../models/InstrumentNew');

const updateLimitOrdersForInstrumentInRedis = async ({
  asks,
  bids,
  instrumentName,
}) => {
  if (!instrumentName) {
    return {
      status: false,
      message: 'No instrumentName',
    };
  }

  if (!asks || !Array.isArray(asks)) {
    return {
      status: false,
      message: 'No or invalid asks',
    };
  }

  if (!bids || !Array.isArray(bids)) {
    return {
      status: false,
      message: 'No or invalid bids',
    };
  }

  const nowTime = moment().startOf('minute').unix();

  const keyInstrument = `INSTRUMENT:${instrumentName}`;
  const keyInstrumentAsks = `INSTRUMENT:${instrumentName}:ASKS`;
  const keyInstrumentBids = `INSTRUMENT:${instrumentName}:BIDS`;

  const fetchDataPromises = [
    redis.getAsync(keyInstrument),
    redis.getAsync(keyInstrumentAsks),
    redis.getAsync(keyInstrumentBids),
  ];

  let [
    cacheInstrumentDoc,
    cacheInstrumentAsks,
    cacheInstrumentBids,
  ] = await Promise.all(fetchDataPromises);

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

  asks.forEach(([
    price, quantity,
  ]) => {
    price = parseFloat(price);
    quantity = parseFloat(quantity);

    if (quantity === 0) {
      cacheInstrumentAsks = cacheInstrumentAsks.filter(elem => elem[0] !== price);
      return true;
    }

    const differenceBetweenPriceAndOrder = Math.abs(cacheInstrumentDoc.price - price);
    const percentPerPrice = 100 / (cacheInstrumentDoc.price / differenceBetweenPriceAndOrder);

    const doesExistPrice = cacheInstrumentAsks.find(
      elem => elem[0] === price,
    );

    if (percentPerPrice > LIMITER_RANGE_FOR_LIMIT_ORDERS) {
      if (!doesExistPrice) {
        return true;
      }

      cacheInstrumentAsks = cacheInstrumentAsks.filter(elem => elem[0] !== price);
      return true;
    }

    if (!doesExistPrice) {
      cacheInstrumentAsks.push([price, quantity, nowTime]);
    } else {
      doesExistPrice[1] = quantity;
      doesExistPrice[2] = nowTime;
    }
  });

  bids.forEach(([
    price, quantity,
  ]) => {
    price = parseFloat(price);
    quantity = parseFloat(quantity);

    if (quantity === 0) {
      cacheInstrumentBids = cacheInstrumentBids.filter(elem => elem[0] !== price);
      return true;
    }

    const differenceBetweenPriceAndOrder = Math.abs(cacheInstrumentDoc.price - price);
    const percentPerPrice = 100 / (cacheInstrumentDoc.price / differenceBetweenPriceAndOrder);

    const doesExistPrice = cacheInstrumentBids.find(
      elem => elem[0] === price,
    );

    if (percentPerPrice > LIMITER_RANGE_FOR_LIMIT_ORDERS) {
      if (!doesExistPrice) {
        return true;
      }

      cacheInstrumentAsks = cacheInstrumentAsks.filter(elem => elem[0] !== price);
      return true;
    }

    if (!doesExistPrice) {
      cacheInstrumentBids.push([price, quantity, nowTime]);
    } else {
      doesExistPrice[1] = quantity;
      doesExistPrice[2] = nowTime;
    }
  });

  await Promise.all([
    redis.setAsync([
      keyInstrumentAsks,
      JSON.stringify(cacheInstrumentAsks),
    ]),
    redis.setAsync([
      keyInstrumentBids,
      JSON.stringify(cacheInstrumentBids),
    ]),
  ]);

  return {
    status: true,
  };
};

module.exports = {
  updateLimitOrdersForInstrumentInRedis,
};
