const {
  isEmpty,
} = require('lodash');

const {
  isMongoId,
} = require('validator');

const InstrumentNew = require('../../../models/InstrumentNew');

const updateInstrument = async ({
  instrumentId,

  price,
  averageVolumeForLast15Minutes,
}) => {
  if (!instrumentId || !isMongoId(instrumentId.toString())) {
    return {
      status: false,
      message: 'No or invalid instrumentId',
    };
  }

  const updateObj = {};

  if (price) {
    updateObj.price = parseFloat(price);
  }

  if (averageVolumeForLast15Minutes) {
    updateObj.average_volume_for_last_15_minutes = averageVolumeForLast15Minutes;
  }

  if (!isEmpty(updateObj)) {
    await InstrumentNew.findByIdAndUpdate(instrumentId, updateObj).exec();
  }

  return {
    status: true,
  };
};

module.exports = {
  updateInstrument,
};
