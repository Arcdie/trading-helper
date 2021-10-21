const {
  isMongoId,
} = require('validator');

const {
  createInstrument,
} = require('./utils/create-instrument');

const logger = require('../../libs/logger');

const Instrument = require('../../models/Instrument');

module.exports = async (req, res, next) => {
  const {
    params: {
      id: instrumentId,
    },

    user,
  } = req;

  if (!user) {
    return res.json({
      status: false,
      message: 'Not authorized',
    });
  }

  if (!instrumentId || !isMongoId(instrumentId)) {
    return res.json({
      status: false,
      message: 'No or invalid instrumentId',
    });
  }

  const instrumentDoc = await Instrument.findById(instrumentId).exec();

  if (!instrumentDoc) {
    return res.json({
      status: false,
      message: 'No Instrument',
    });
  }

  if (!instrumentDoc.is_active) {
    return res.json({
      status: false,
      message: 'Instrument is not active',
    });
  }

  return res.json({
    status: true,
    result: instrumentDoc._doc,
  });
};
