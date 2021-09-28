const Instrument = require('../../../models/Instrument');

const createInstrument = async ({
  name,
}) => {
  const instrumentDoc = await Instrument.findOne({
    name,
  }).exec();

  if (instrumentDoc) {
    return {
      status: true,
      isCreated: false,
      result: instrumentDoc._doc,
    };
  }

  const newInstrument = new Instrument({
    name,
  });

  await newInstrument.save();

  return {
    status: true,
    isCreated: true,
    result: newInstrument._doc,
  };
};

module.exports = {
  createInstrument,
};
