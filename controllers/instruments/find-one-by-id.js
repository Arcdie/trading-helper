const {
  isMongoId,
} = require('validator');

const logger = require('../../libs/logger');

const InstrumentNew = require('../../models/InstrumentNew');

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

  const instrumentDoc = await InstrumentNew.findById(instrumentId).exec();

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
