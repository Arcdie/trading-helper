const moment = require('moment');

const redis = require('../../../libs/redis');

const InstrumentNew = require('../../../models/InstrumentNew');

const increaseVolumeForInstrumentInRedis = async ({
  instrumentName,
  quantity,
}) => {
  if (!instrumentName) {
    return {
      status: false,
      message: 'No instrumentName',
    };
  }

  const startMinuteUnix = moment().startOf('minute').unix();
  const key = `INSTRUMENT:${instrumentName}:VOLUME`;

  let cacheDoc = await redis.getAsync(key);

  if (!cacheDoc) {
    cacheDoc = [];
  } else {
    cacheDoc = JSON.parse(cacheDoc);
  }

  const doesExistTimestamp = cacheDoc.find(
    element => element.timestamp === startMinuteUnix,
  );

  if (!doesExistTimestamp) {
    cacheDoc.push({
      timestamp: startMinuteUnix,
      quantity: parseFloat(quantity),
    });
  } else {
    doesExistTimestamp.quantity += parseFloat(quantity);
    doesExistTimestamp.quantity = parseInt(doesExistTimestamp.quantity, 10);
  }

  const lCacheDoc = cacheDoc.length;

  if (lCacheDoc > 30) {
    const nIterations = lCacheDoc - 30;
    for (let i = 0; i < nIterations; i += 1) {
      cacheDoc.shift();
    }
  }

  await redis.setAsync([
    key,
    JSON.stringify(cacheDoc),
  ]);

  return {
    status: true,
  };
};

module.exports = {
  increaseVolumeForInstrumentInRedis,
};
