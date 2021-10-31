const moment = require('moment');

const {
  isMongoId,
} = require('validator');

const {
  sendMessage,
} = require('../../../services/telegram-bot');

const {
  DEFAULT_INDENT_IN_PERCENTS,
  TYPE_CANDLES_FOR_FIND_LEVELS,
} = require('../constants');

const User = require('../../../models/User');
const Instrument = require('../../../models/Instrument');
const UserLevelBound = require('../../../models/UserLevelBound');

const createUserLevelBound = async ({
  userId,
  // indentInPercents,

  instrumentId,
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

  if (!instrumentPrice || isNaN(parseFloat(instrumentPrice))) {
    return {
      status: false,
      message: 'No or invalid instrumentPrice',
    };
  }

  /*
  if (!indentInPercents) {
    const userDoc = await User.findById(userId, {
      settings: 1,
    }).exec();

    if (!userDoc) {
      return {
        status: false,
        text: 'No User',
      };
    }

    if (!userDoc.settings) {
      userDoc.settings = {};
    }

    indentInPercents = userDoc.settings.indent_in_percents || DEFAULT_INDENT_IN_PERCENTS;
  } else if (isNaN(parseFloat(indentInPercents))) {
    return {
      status: false,
      message: 'Invalid indentInPercents',
    };
  }
  */

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

    indent_in_percents: DEFAULT_INDENT_IN_PERCENTS,
  });

  await newLevel.save();

  return {
    status: true,
    result: newLevel._doc,
  };
};

module.exports = {
  createUserLevelBound,
};
