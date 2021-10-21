const {
  isMongoId,
} = require('validator');

const {
  isUndefined,
} = require('lodash');

const redis = require('../../../libs/redis');

const InstrumentVolumeBound = require('../../../models/InstrumentVolumeBound');

const createInstrumentVolumeBound = async ({
  instrumentId,

  price,
  quantity,
  averageVolumeForLast15Minutes,

  isAsk,
}) => {
  if (!instrumentId || !isMongoId(instrumentId.toString())) {
    return {
      status: false,
      message: 'No or invalid instrumentId',
    };
  }

  if (!price) {
    return {
      status: false,
      message: 'No or invalid price',
    };
  }

  if (!quantity) {
    return {
      status: false,
      message: 'No or invalid quantity',
    };
  }

  if (!averageVolumeForLast15Minutes) {
    return {
      status: false,
      message: 'No or invalid averageVolumeForLast15Minutes',
    };
  }

  if (isUndefined(isAsk)) {
    return {
      status: false,
      message: 'No or invalid isAsk',
    };
  }

  const newBound = new InstrumentVolumeBound({
    instrument_id: instrumentId,
    price,
    quantity,
    average_volume_for_last_15_minutes: averageVolumeForLast15Minutes,
    is_ask: isAsk,
  });

  await newBound.save();

  return {
    status: true,
    result: newBound._doc,
  };
};

module.exports = {
  createInstrumentVolumeBound,
};
