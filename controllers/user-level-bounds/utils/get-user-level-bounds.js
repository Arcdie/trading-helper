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

const getUserLevelBounds = async ({
  userId,
}) => {
  if (!userId || !isMongoId(userId.toString())) {
    return {
      status: false,
      message: 'No or invalid userId',
    };
  }

  const userLevelBounds = await UserLevelBound.find({
    user_id: userId,
    is_worked: false,
  }).exec();

  if (!userLevelBounds || !userLevelBounds.length) {
    return {
      status: true,
      result: [],
    };
  }

  const instrumentsIds = userLevelBounds.map(bound => bound.instrument_id);

  const instrumentsDocs = await Instrument.find({
    _id: {
      $in: instrumentsIds,
    },
  }).exec();

  const result = userLevelBounds.map(bound => {
    const instrumentDoc = instrumentsDocs.find(
      doc => doc._id.toString() === bound.instrument_id.toString(),
    );

    return {
      ...bound._doc,
      instrument_doc: instrumentDoc._doc,
    };
  });

  return {
    status: true,
    result,
  };
};

module.exports = {
  getUserLevelBounds,
};
