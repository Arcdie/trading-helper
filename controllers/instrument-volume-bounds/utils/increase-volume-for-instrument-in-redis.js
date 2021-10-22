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

  const fetchDataPromises = [
    redis.hkeysAsync(key),
    redis.hmgetAsync(key, startMinuteUnix),
  ];

  let [
    cacheVolumeKeys,
    cacheVolumeValue,
  ] = await Promise.all(fetchDataPromises);

  cacheVolumeValue = cacheVolumeValue[0];

  if (!cacheVolumeValue) {
    cacheVolumeValue = quantity;
  } else {
    cacheVolumeValue = parseInt(parseFloat(cacheVolumeValue) + parseFloat(quantity), 10);
  }

  const lVolumeKeys = cacheVolumeKeys.length;

  if (lVolumeKeys > 30) {
    const keysToRemove = [];
    const nIterations = lVolumeKeys - 30;

    for (let i = 0; i < nIterations; i += 1) {
      keysToRemove.push(cacheVolumeKeys[i]);
    }

    await redis.hdelAsync(key, keysToRemove);
  }

  await redis.hmsetAsync(key, startMinuteUnix, cacheVolumeValue);

  return {
    status: true,
  };
};

module.exports = {
  increaseVolumeForInstrumentInRedis,
};
