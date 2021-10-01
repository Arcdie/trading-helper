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
    body: {
      userId,
      arrOfInstrumentsIds,
    },
  } = req;

  if (!userId || !isMongoId(userId)) {
    return res.json({
      status: false,
      text: 'No or invalid userId',
    });
  }

  if (!arrOfInstrumentsIds || !Array.isArray(arrOfInstrumentsIds)) {
    return res.json({
      status: false,
      text: 'No or invalid names',
    });
  }

  const userDoc = await User.findById(userId, { _id: 1 }).exec();

  if (!userDoc) {
    return res.json({
      status: false,
      text: 'No User',
    });
  }

  const instrumentsDocs = await Instrument.find({
    _id: {
      $in: arrOfInstrumentsIds,
    },
  }, { _id: 1 }).exec();

  console.log('instrumentsDocs', instrumentsDocs);

  await Promise.all(instrumentsDocs.map(async instrumentDoc => {
    console.log('instrumentDoc', instrumentDoc._id);
    const resultCreate = await createBound({
      userId,
      instrumentId: instrumentDoc._id,
    });

    if (!resultCreate) {
      logger.warn(resultCreate.result || 'Cant createInstrument');
      return null;
    }
  }));

  return res.json({
    status: true,
  });
};
