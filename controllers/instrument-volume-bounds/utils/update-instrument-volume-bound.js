const {
  isEmpty,
  isUndefined,
} = require('lodash');

const {
  isMongoId,
} = require('validator');

const InstrumentVolumeBound = require('../../../models/InstrumentVolumeBound');

const updateInstrumentVolumeBound = async ({
  boundId,

  quantity,
  isActive,
  averageVolumeForLast15Minutes,
}) => {
  if (!boundId || !isMongoId(boundId.toString())) {
    return {
      status: false,
      message: 'No or invalid boundId',
    };
  }

  const updateObj = {};

  if (!isUndefined(isActive)) {
    updateObj.is_active = isActive;
  }

  if (quantity) {
    updateObj.quantity = quantity;
  }

  if (averageVolumeForLast15Minutes) {
    updateObj.average_volume_for_last_15_minutes = averageVolumeForLast15Minutes;
  }

  if (!isEmpty(updateObj)) {
    await InstrumentVolumeBound.findByIdAndUpdate(boundId, updateObj).exec();
  }

  return {
    status: true,
  };
};

module.exports = {
  updateInstrumentVolumeBound,
};
