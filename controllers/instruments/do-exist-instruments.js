const {
  createInstrument,
} = require('./utils/create-instrument');

const logger = require('../../logger');

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
  }, { name: 1 }).exec();

  const result = await Promise.all(arrOfNames.map(async name => {
    const instrumentDoc = instrumentsDocs.find(doc => doc.name === name);

    if (!instrumentDoc) {
      const resultCreate = await createInstrument({
        name,
      });

      if (!resultCreate) {
        logger.warn(resultCreate.result || 'Cant createInstrument');
        return null;
      }

      return resultCreate.result;
    }

    return instrumentDoc._doc;
  }));

  return res.json({
    status: true,
    result,
  });
};
