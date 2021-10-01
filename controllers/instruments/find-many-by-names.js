const {
  createInstrument,
} = require('./utils/create-instrument');

const logger = require('../../libs/logger');

const Instrument = require('../../models/Instrument');

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

  const instrumentsDocs = await Instrument.find({
    name: {
      $in: arrOfNames,
    },
  }, {
    name: 1,
    is_active: 1,
  }).exec();

  await Promise.all(arrOfNames.map(async instrumentName => {
    const instrumentDoc = instrumentsDocs.find(doc => doc.name === instrumentName);

    if (instrumentDoc) {
      return null;
    }

    const resultCreate = await createInstrument({
      name,

      isActive: false,
      isModerated: false,
    });
  }));

  return res.json({
    status: true,
    result: instrumentsDocs.map(doc => doc._doc),
  });
};
