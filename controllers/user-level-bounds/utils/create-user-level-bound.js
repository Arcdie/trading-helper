const moment = require('moment');

const {
  isMongoId,
} = require('validator');

const log = require('../../../libs/logger')(module);

const {
  addLevelsToRedis,
} = require('./add-levels-to-redis');

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
  try {
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

    await addLevelsToRedis({
      userId,
      instrumentName,

      levels: [{
        boundId: newLevel._id,
        isLong: newLevel.is_long,
        levelPrice: newLevel.level_price,
      }],
    });

    return {
      status: true,
      result: newLevel._doc,
    };
  } catch (error) {
    log.warn(error.message);

    return {
      status: false,
      message: error.message,
    };
  }
};

module.exports = {
  createUserLevelBound,
};
