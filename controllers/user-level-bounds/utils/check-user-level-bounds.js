const redis = require('../../../libs/redis');

const UserLevelBound = require('../../../models/UserLevelBound');

const checkUserLevelBounds = async ({
  instrumentName,
  instrumentPrice,
}) => {
  if (!instrumentName) {
    return {
      status: false,
      message: 'No instrumentName',
    };
  }

  if (!instrumentPrice) {
    return {
      status: false,
      message: 'No instrumentPrice',
    };
  }

  const keyInstrumentLevelBounds = `INSTRUMENT:${instrumentName}:LEVEL_BOUNDS`;
  let cacheInstrumentLevelBoundsKeys = await redis.hkeysAsync(keyInstrumentLevelBounds);

  if (!cacheInstrumentLevelBoundsKeys) {
    cacheInstrumentLevelBoundsKeys = [];
  }

  const targetKeys = [];

  cacheInstrumentLevelBoundsKeys.forEach(key => {
    let [price, prefix] = key.split('_');
    const isLong = prefix === 'long';

    price = parseFloat(price);

    if (isLong
      && price < instrumentPrice) {
      targetKeys.push(key);
    } else if (!isLong
      && instrumentPrice < price) {
      targetKeys.push(key);
    }
  });

  if (!targetKeys.length) {
    return {
      status: true,
    };
  }

  let boundsIds = await redis.hmgetAsync(
    keyInstrumentLevelBounds, targetKeys,
  );

  if (!boundsIds) {
    boundsIds = [];
  } else {
    boundsIds = JSON.parse(boundsIds);
  }

  if (!boundsIds || !boundsIds.length) {
    return {
      status: true,
    };
  }

  await UserLevelBound.updateMany({
    _id: { $in: boundsIds },
  }, {
    is_worked: true,
    worked_at: new Date(),
  });

  await redis.hdelAsync(
    keyInstrumentLevelBounds,
    targetKeys,
  );

  return {
    status: true,
  };
};

module.exports = {
  checkUserLevelBounds,
};
