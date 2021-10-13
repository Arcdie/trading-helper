const {
  isMongoId,
} = require('validator');

const {
  sendMessage,
} = require('../../../services/telegram-bot');

const {
  DEFAULT_INDENT_IN_PERCENTS,
} = require('../constants');

const User = require('../../../models/User');
const Instrument = require('../../../models/Instrument');
const UserLevelBound = require('../../../models/UserLevelBound');

const createUserLevelBound = async ({
  userId,
  indentInPercents,

  instrumentId,
  instrumentPrice,

  timeframe,
  priceOriginal,
}) => {
  if (!userId || !isMongoId(userId.toString())) {
    return {
      status: false,
      message: 'No or invalid userId',
    };
  }

  if (!priceOriginal || isNaN(parseFloat(priceOriginal))) {
    return {
      status: false,
      message: 'No or invalid priceOriginal',
    };
  }

  if (!timeframe || !['4h', '5m'].includes(timeframe)) {
    return {
      status: false,
      message: 'No or invalid timeframe',
    };
  }

  if (!instrumentPrice) {
    if (!instrumentId || !isMongoId(instrumentId.toString())) {
      return {
        status: false,
        message: 'No or invalid instrumentId',
      };
    }

    const instrumentDoc = await Instrument.findById(instrumentId, {
      price: 1,
    }).exec();

    if (!instrumentDoc) {
      return {
        status: false,
        text: 'No Instrument',
      };
    }

    instrumentPrice = instrumentDoc.price;
  } else if (isNaN(parseFloat(instrumentPrice))) {
    return {
      status: false,
      message: 'Invalid instrumentPrice',
    };
  }

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

  const isLong = priceOriginal > instrumentPrice;

  const userLevelBound = await UserLevelBound.findOne({
    user_id: userId,
    instrument_id: instrumentId,

    is_long: isLong,
    price_original: priceOriginal,

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

    level_timeframe: timeframe,
    price_original: priceOriginal,
    indent_in_percents: indentInPercents,
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
