const {
  isMongoId,
} = require('validator');

const logger = require('../../libs/logger');

const User = require('../../models/User');
const Instrument = require('../../models/Instrument');
const UserLevelBound = require('../../models/UserLevelBound');

module.exports = async (req, res, next) => {
  const {
    query: {
      userId,
    },
  } = req;

  if (!userId || !isMongoId(userId)) {
    return res.json({
      status: false,
      text: 'No or invalid userId',
    });
  }

  const userDoc = await User.findById(userId, { _id: 1 }).exec();

  if (!userDoc) {
    return res.json({
      status: false,
      text: 'No User',
    });
  }

  const userLevelBounds = await UserLevelBound.find({
    user_id: userDoc._id,
    // instrument_id: '615304439d5a48264866ef80', // tmp

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

  return res.json({
    status: true,
    result,
  });
};
