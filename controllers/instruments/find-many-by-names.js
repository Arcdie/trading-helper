const {
  createInstrument,
} = require('./utils/create-instrument');

const logger = require('../../libs/logger');

const InstrumentNew = require('../../models/InstrumentNew');

module.exports = async (req, res, next) => {
  const {
    body: {
      arrOfNames,
    },
  } = req;

  if (!arrOfNames || !Array.isArray(arrOfNames)) {
    return res.json({
      status: false,
      text: 'No or invalid names',
    });
  }

  const instrumentsDocs = await InstrumentNew.find({
    name: {
      $in: arrOfNames,
    },
  }, {
    name: 1,
    is_active: 1,
  }).exec();

  return res.json({
    status: true,
    result: instrumentsDocs.map(doc => doc._doc),
  });
};
