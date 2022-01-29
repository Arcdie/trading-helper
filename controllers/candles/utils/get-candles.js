const moment = require('moment');

const {
  isMongoId,
} = require('validator');

const log = require('../../../libs/logger')(module);

const {
  INTERVALS,
  LIMIT_CANDLES,
} = require('../constants');

const Candle1m = require('../../../models/Candle-1m');
const Candle5m = require('../../../models/Candle-5m');
const Candle1h = require('../../../models/Candle-1h');
const Candle4h = require('../../../models/Candle-4h');
const Candle1d = require('../../../models/Candle-1d');

const getCandles = async ({
  instrumentId,
  startTime,
  interval,
  endTime,
  limit,
}) => {
  try {
    if (!interval || !INTERVALS.get(interval)) {
      return {
        status: false,
        message: 'No or invalid interval',
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

    if (instrumentId && !isMongoId(instrumentId.toString())) {
      return {
        status: false,
        message: 'Invalid instrumentId',
      };
    }

    if (limit && limit > LIMIT_CANDLES) {
      limit = LIMIT_CANDLES;
    }

    let SearchModel;

    if (interval === '1m') {
      SearchModel = Candle1m;
    } else if (interval === '5m') {
      SearchModel = Candle5m;
    } else if (interval === '1h') {
      SearchModel = Candle1h;
    } else if (interval === '4h') {
      SearchModel = Candle4h;
    } else if (interval === '1d') {
      SearchModel = Candle1d;
    }

    const matchObj = {};

    if (instrumentId) {
      matchObj.instrument_id = instrumentId;
    }

    if (startTime && endTime) {
      const momentStartTime = moment(startTime).utc().startOf('minute');
      const momentEndTime = moment(endTime).utc().startOf('minute');

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
      const momentStartTime = moment(startTime).utc().startOf('minute');

      matchObj.time = {
        $gt: momentStartTime,
      };
    } else if (endTime) {
      const momentEndTime = moment(endTime).utc().startOf('minute');

      matchObj.time = {
        $lt: momentEndTime,
      };
    }

    const Query = SearchModel
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
  } catch (error) {
    log.error(error.message);

    return {
      status: true,
      message: error.message,
    };
  }
};

module.exports = {
  getCandles,
};
