const moment = require('moment');

const {
  isUndefined,
} = require('lodash');

const {
  isMongoId,
} = require('validator');

const InstrumentVolumeBound = require('../../../models/InstrumentVolumeBound');

const getInstrumentVolumeBounds = async ({
  instrumentId,
  isOnlyActive,

  startDate,
  endDate,
}) => {
  if (instrumentId && !isMongoId(instrumentId.toString())) {
    return {
      status: false,
      message: 'Invalid instrumentId',
    };
  }

  if (startDate && !moment(startDate).isValid()) {
    return {
      status: false,
      message: 'Invalid startDate',
    };
  }

  if (endDate && !moment(endDate).isValid()) {
    return {
      status: false,
      message: 'Invalid endDate',
    };
  }

  const matchObj = {};

  if (instrumentId) {
    matchObj.instrument_id = instrumentId;
  }

  if (!isUndefined(isOnlyActive)) {
    matchObj.is_active = isOnlyActive;
  }

  if (startDate && endDate) {
    const momentStartTime = moment(startDate).utc().startOf('minute');
    const momentEndTime = moment(endDate).utc().startOf('minute');

    matchObj.$and = [{
      volume_started_at: {
        $gt: momentStartTime,
      },
    }, {
      volume_started_at: {
        $lt: momentEndTime,
      },
    }];
  } else if (startDate) {
    const momentStartTime = moment(startDate).utc().startOf('minute');

    matchObj.volume_started_at = {
      $gt: momentStartTime,
    };
  } else if (endDate) {
    const momentEndTime = moment(endDate).utc().startOf('minute');

    matchObj.volume_started_at = {
      $lt: momentEndTime,
    };
  }

  const instrumentVolumeBounds = await InstrumentVolumeBound
    .find(matchObj)
    .sort({ created_at: 1 })
    // .limit(10)
    .exec();

  return {
    status: true,
    result: instrumentVolumeBounds.map(bound => bound._doc),
  };
};

module.exports = {
  getInstrumentVolumeBounds,
};
