const moment = require('moment');

const {
  isMongoId,
} = require('validator');

const log = require('../../../libs/logger');
const redis = require('../../../libs/redis');

const Candle = require('../../../models/Candle');
const InstrumentNew = require('../../../models/InstrumentNew');

const getCandles = async ({
  instrumentId,
  startTime,
  endTime,
  limit,
}) => {
  if (!instrumentId || !isMongoId(instrumentId.toString())) {
    return {
      status: false,
      message: 'No or invalid instrumentId',
    };
  }

  if (startTime && !moment(startTime).isValid()) {
    return {
      status: false,
      message: 'Invalid startTime',
    };
  }

  if (endTime && !moment(endTime).isValid()) {
    return {
      status: false,
      message: 'Invalid endTime',
    };
  }

  const instrumentDoc = await InstrumentNew.findById(instrumentId, {
    name: 1,
    is_active: 1,
  }).exec();

  if (!instrumentDoc) {
    return {
      status: false,
      message: 'No Instrument',
    };
  }

  if (!instrumentDoc.is_active) {
    return {
      status: false,
      message: 'Instrument is not active',
    };
  }

  const matchObj = {
    instrument_id: instrumentId,
  };

  if (startTime && endTime) {
    const momentStartTime = moment(startTime).startOf('minute');
    const momentEndTime = moment(endTime).startOf('minute');

    matchObj.$and = [{
      time: {
        $gt: momentStartTime,
      },
    }, {
      time: {
        $lt: momentEndTime,
      },
    }];
  } else if (startTime) {
    const momentStartTime = moment(startTime).startOf('minute');

    matchObj.time = {
      $gt: momentStartTime,
    };
  } else if (endTime) {
    const momentEndTime = moment(endTime).startOf('minute');

    matchObj.time = {
      $lt: momentEndTime,
    };
  }

  const Query = Candle
    .find(matchObj)
    .sort({ time: -1 });

  if (limit) {
    Query.limit(parseInt(limit, 10));
  }

  const candlesDocs = await Query.exec();

  return {
    status: true,
    result: candlesDocs.map(doc => doc._doc),
  };
};

module.exports = {
  getCandles,
};
