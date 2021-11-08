const moment = require('moment');

const {
  isMongoId,
} = require('validator');

const redis = require('../../../libs/redis');

const {
  TYPE_CANDLES_FOR_FIND_LEVELS,
} = require('../constants');

const UserLevelBound = require('../../../models/UserLevelBound');

const createUserLevelBound = async ({
  userId,

  instrumentId,
  instrumentName,
  instrumentPrice,

  levelPrice,
  levelTimeframe,
  levelStartCandleTime,
}) => {
  if (!userId || !isMongoId(userId.toString())) {
    return {
      status: false,
      message: 'No or invalid userId',
    };
  }

  if (!levelPrice || isNaN(parseFloat(levelPrice))) {
    return {
      status: false,
      message: 'No or invalid levelPrice',
    };
  }

  if (!levelTimeframe || !TYPE_CANDLES_FOR_FIND_LEVELS.includes(levelTimeframe)) {
    return {
      status: false,
      message: 'No or invalid levelTimeframe',
    };
  }

  if (!levelStartCandleTime || !moment(levelStartCandleTime).isValid()) {
    return {
      status: false,
      message: 'No or invalid levelStartCandleTime',
    };
  }

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

  if (!instrumentPrice || isNaN(parseFloat(instrumentPrice))) {
    return {
      status: false,
      message: 'No or invalid instrumentPrice',
    };
  }

  const isLong = levelPrice > instrumentPrice;

  const userLevelBound = await UserLevelBound.findOne({
    user_id: userId,
    instrument_id: instrumentId,

    is_long: isLong,
    level_price: levelPrice,

    is_worked: false,
  }).exec();

  if (userLevelBound) {
    return {
      status: true,
      isCreated: false,
      result: userLevelBound._doc,
    };
  }

  const newLevel = new UserLevelBound({
    user_id: userId,
    instrument_id: instrumentId,

    is_long: isLong,

    level_price: levelPrice,
    level_timeframe: levelTimeframe,
    level_start_candle_time: levelStartCandleTime,
  });

  await newLevel.save();

  const keyInstrumentLevelBounds = `INSTRUMENT:${instrumentName}:LEVEL_BOUNDS`;
  let cacheInstrumentLevelBoundsKeys = await redis.hkeysAsync(keyInstrumentLevelBounds);

  if (!cacheInstrumentLevelBoundsKeys) {
    cacheInstrumentLevelBoundsKeys = [];
  }

  const prefix = isLong ? 'long' : 'short';
  const instrumentLevelBoundKey = `${levelPrice}_${prefix}`;

  const existLevel = cacheInstrumentLevelBoundsKeys.find(
    key => key === instrumentLevelBoundKey,
  );

  let cacheInstrumentLevelBounds = [];

  if (existLevel) {
    cacheInstrumentLevelBounds = await redis.hmgetAsync(
      keyInstrumentLevelBounds, instrumentLevelBoundKey,
    );

    if (!cacheInstrumentLevelBounds) {
      cacheInstrumentLevelBounds = [];
    }

    cacheInstrumentLevelBounds.push({
      // is_long: isLong,
      bound_id: newLevel._id.toString(),
    });
  } else {
    cacheInstrumentLevelBounds.push({
      // is_long: isLong,
      bound_id: newLevel._id.toString(),
    });
  }

  await redis.hmsetAsync(
    keyInstrumentLevelBounds,
    instrumentLevelBoundKey,
    JSON.stringify(cacheInstrumentLevelBounds),
  );

  return {
    status: true,
    result: newLevel._doc,
  };
};

module.exports = {
  createUserLevelBound,
};
