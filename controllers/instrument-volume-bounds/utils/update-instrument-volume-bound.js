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

  isActive,
  endQuantity,
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

  if (!isUndefined(endQuantity)) {
    updateObj.end_quantity = endQuantity;
    updateObj.volume_ended_at = new Date();
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
