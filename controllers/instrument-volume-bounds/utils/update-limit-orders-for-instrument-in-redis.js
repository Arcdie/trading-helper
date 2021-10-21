const redis = require('../../../libs/redis');

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

  let cacheDocAsks = await redis.getAsync(`INSTRUMENT:${instrumentName}:ASKS`);
  let cacheDocBids = await redis.getAsync(`INSTRUMENT:${instrumentName}:BIDS`);

  if (!cacheDocAsks) {
    cacheDocAsks = [];
  } else {
    cacheDocAsks = JSON.parse(cacheDocAsks);
  }

  if (!cacheDocBids) {
    cacheDocBids = [];
  } else {
    cacheDocBids = JSON.parse(cacheDocBids);
  }

  asks.forEach(([
    price, quantity,
  ]) => {
    price = parseFloat(price);
    quantity = parseFloat(quantity);

    if (quantity === 0) {
      cacheDocAsks = cacheDocAsks.filter(elem => elem[0] !== price);
      return true;
    }

    const doesExistPrice = cacheDocAsks.find(
      elem => elem[0] === price,
    );

    if (!doesExistPrice) {
      cacheDocAsks.push([price, quantity]);
    } else {
      doesExistPrice[1] = quantity;
    }
  });

  bids.forEach(([
    price, quantity,
  ]) => {
    price = parseFloat(price);
    quantity = parseFloat(quantity);

    if (quantity === 0) {
      cacheDocBids = cacheDocBids.filter(elem => elem[0] !== price);
      return true;
    }

    const doesExistPrice = cacheDocBids.find(
      elem => elem[0] === price,
    );

    if (!doesExistPrice) {
      cacheDocBids.push([price, quantity]);
    } else {
      doesExistPrice[1] = quantity;
    }
  });

  await redis.setAsync([
    `INSTRUMENT:${instrumentName}:ASKS`,
    JSON.stringify(cacheDocAsks),
  ]);

  await redis.setAsync([
    `INSTRUMENT:${instrumentName}:BIDS`,
    JSON.stringify(cacheDocBids),
  ]);

  return {
    status: true,
  };
};

module.exports = {
  updateLimitOrdersForInstrumentInRedis,
};
