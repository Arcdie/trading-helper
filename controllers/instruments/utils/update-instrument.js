const {
  isEmpty,
  isUndefined,
} = require('lodash');

const {
  isMongoId,
} = require('validator');

const InstrumentNew = require('../../../models/InstrumentNew');

const updateInstrument = async ({
  instrumentId,

  price,
  averageVolume,
  doesIgnoreVolume,
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

  if (averageVolume) {
    updateObj.average_volume = averageVolume;
  }

  if (averageVolumeForLast15Minutes) {
    updateObj.average_volume_for_last_15_minutes = averageVolumeForLast15Minutes;
  }

  if (!isUndefined(doesIgnoreVolume)) {
    updateObj.does_ignore_volume = doesIgnoreVolume;
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
