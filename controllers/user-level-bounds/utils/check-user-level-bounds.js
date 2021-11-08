const {
  isMongoId,
} = require('validator');

const redis = require('../../../libs/redis');

const {
  sendPrivateData,
} = require('../../../websocket/websocket-server');

const {
  PRIVATE_ACTION_NAMES,
} = require('../../../websocket/constants');

const UserLevelBound = require('../../../models/UserLevelBound');

const checkUserLevelBounds = async ({
  instrumentId,
  instrumentName,
  instrumentPrice,
}) => {
  if (!instrumentId || !isMongoId(instrumentId.toString())) {
    return {
      status: false,
      message: 'No or invalid instrumentId',
    };
  }

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

  let cacheInstrumentLevelBounds = await redis.hmgetAsync(
    keyInstrumentLevelBounds, targetKeys,
  );

  if (!cacheInstrumentLevelBounds) {
    cacheInstrumentLevelBounds = [];
  } else {
    cacheInstrumentLevelBounds = JSON.parse(cacheInstrumentLevelBounds);
  }

  if (!cacheInstrumentLevelBounds || !cacheInstrumentLevelBounds.length) {
    return {
      status: true,
    };
  }

  cacheInstrumentLevelBounds.forEach(bound => {
    sendPrivateData({
      userId: bound.user_id,
      actionName: PRIVATE_ACTION_NAMES.get('levelWasWorked'),
      data: {
        instrumentId,
        boundId: bound.bound_id,
      },
    });
  });

  await UserLevelBound.updateMany({
    _id: {
      $in: cacheInstrumentLevelBounds.map(bound => bound.bound_id),
    },
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
