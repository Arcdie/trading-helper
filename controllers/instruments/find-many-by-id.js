const {
  createInstrument,
} = require('./utils/create-instrument');

const logger = require('../../libs/logger');

const InstrumentNew = require('../../models/InstrumentNew');

module.exports = async (req, res, next) => {
  let {
    query: {
      instrumentsIds,
    },

    user,
  } = req;

  if (!user) {
    return res.json({
      status: false,
      message: 'Not authorized',
    });
  }

  instrumentsIds = instrumentsIds.split(',');

  if (!instrumentsIds || !Array.isArray(instrumentsIds)) {
    return res.json({
      status: false,
      text: 'No or invalid instrumentsIds',
    });
  }

  const instrumentsDocs = await InstrumentNew.find({
    _id: { $in: instrumentsIds },
  }).exec();

  return res.json({
    status: true,
    result: instrumentsDocs.map(doc => doc._doc),
  });
};
