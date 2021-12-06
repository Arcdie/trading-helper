const moment = require('moment');

const {
  isUndefined,
} = require('lodash');

const {
  isMongoId,
} = require('validator');

const log = require('../../libs/logger')(module);

const {
  getInstrumentVolumeBounds,
} = require('./utils/get-instrument-volume-bounds');

module.exports = async (req, res, next) => {
  try {
    const {
      query: {
        isOnlyActive,
        instrumentId,
        startTime,
        endTime,
      },

      user,
    } = req;

    if (!user) {
      return res.json({
        status: false,
        message: 'Not authorized',
      });
    }

    if (instrumentId && !isMongoId(instrumentId.toString())) {
      return res.json({
        status: false,
        message: 'Invalid instrumentId',
      });
    }

    if (startTime && !moment(startTime).isValid()) {
      return res.json({
        status: false,
        message: 'Invalid startTime',
      });
    }

    if (endTime && !moment(endTime).isValid()) {
      return res.json({
        status: false,
        message: 'Invalid endTime',
      });
    }

  const funcObj = {};

  if (instrumentId) {
    funcObj.instrumentId = instrumentId;
  }

  if (startTime) {
    funcObj.startDate = startTime;
  }

  if (endTime) {
    funcObj.endDate = endTime;
  }

  if (!isUndefined(isOnlyActive)) {
    funcObj.isOnlyActive = isOnlyActive === 'true';
  }

  const resultGetBounds = await getInstrumentVolumeBounds(funcObj);

  if (!resultGetBounds || !resultGetBounds.status) {
    const message = resultGetBounds.message || 'Cant getInstrumentVolumeBounds';
    log.warn(message);

    return res.json({
      status: false,
      message,
    });
  }

  return res.json({
    status: true,
    result: resultGetBounds.result,
  });
};
