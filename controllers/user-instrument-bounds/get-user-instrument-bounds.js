const {
  isMongoId,
} = require('validator');

const logger = require('../../libs/logger');

const {
  createBound,
} = require('./utils/create-bound');

const User = require('../../models/User');
const Instrument = require('../../models/Instrument');
const UserInstrumentBound = require('../../models/UserInstrumentBound');

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

  const userInstrumentBounds = await UserInstrumentBound.find({
    user_id: userDoc._id,
  }).exec();

  if (!userInstrumentBounds || !userInstrumentBounds.length) {
    return {
      status: true,
      result: [],
    };
  }

  const instrumentsIds = userInstrumentBounds.map(bound => bound.instrument_id);

  const instrumentsDocs = await Instrument.find({
    _id: {
      $in: instrumentsIds,
    },
  }).exec();

  const result = userInstrumentBounds.map(bound => {
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
