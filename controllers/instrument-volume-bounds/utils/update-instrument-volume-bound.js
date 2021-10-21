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
