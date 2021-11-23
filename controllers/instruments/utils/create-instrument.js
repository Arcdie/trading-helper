const InstrumentNew = require('../../../models/InstrumentNew');
const InstrumentTrend = require('../../../models/InstrumentTrend');

const createInstrument = async ({
  name,
  price,

  isFutures,
}) => {
  if (!name) {
    return {
      status: false,
      message: 'No name',
    };
  }

  if (!price) {
    return {
      status: false,
      message: 'No price',
    };
  }

  const instrumentDoc = await InstrumentNew.findOne({
    name,
  }).exec();

  if (instrumentDoc) {
    return {
      status: true,
      isCreated: false,
      result: instrumentDoc._doc,
    };
  }

  const newInstrument = new InstrumentNew({
    name,
    price,

    is_active: true,
    is_futures: isFutures || false,
  });

  await newInstrument.save();

  const newInstrumentTrend = new InstrumentTrend({
    instrument_id: newInstrument._id,
  });

  await newInstrumentTrend.save();

  return {
    status: true,
    isCreated: true,
    result: newInstrument._doc,
  };
};

module.exports = {
  createInstrument,
};
