const Instrument = require('../../../models/Instrument');

const createInstrument = async ({
  nameSpot,
  nameFutures,

  price,

  isActive,
}) => {
  if (!nameSpot) {
    return {
      status: false,
      message: 'No nameSpot',
    };
  }

  if (!nameFutures) {
    return {
      status: false,
      message: 'No nameFutures',
    };
  }

  if (!price) {
    return {
      status: false,
      message: 'No price',
    };
  }

  const instrumentDoc = await Instrument.findOne({
    $or: [{
      name_spot: nameSpot,
    }, {
      name_futures: nameFutures,
    }],
  }).exec();

  if (instrumentDoc) {
    return {
      status: true,
      isCreated: false,
      result: instrumentDoc._doc,
    };
  }

  const newInstrument = new Instrument({
    name_spot: nameSpot,
    name_futures: nameFutures,

    price,

    is_active: isActive,
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
