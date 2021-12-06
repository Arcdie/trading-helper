const moment = require('moment');

const {
  isMongoId,
} = require('validator');

const log = require('../../libs/logger/index')(module);

const {
  getCandles,
} = require('./utils/get-candles');

const {
  getCandlesFromRedis,
} = require('./utils/get-candles-from-redis');

const {
  getInstrumentName,
} = require('../instruments/utils/get-instrument-name');

const {
  INTERVALS,
  LIMIT_CANDLES,
} = require('./constants');

module.exports = async (req, res, next) => {
  try {
    const {
      params: {
        interval,
      },

      query: {
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

    if (!instrumentId || !isMongoId(instrumentId)) {
      return res.json({
        status: false,
        message: 'No or invalid instrumentId',
      });
    }

    if (!interval || !INTERVALS.get(interval)) {
      return res.json({
        status: false,
        message: 'No or invalid interval',
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

    let {
      isFirstCall,
      limit,
    } = req.query;

    if (limit && limit > LIMIT_CANDLES) {
      limit = LIMIT_CANDLES;
    }

    isFirstCall = (isFirstCall && isFirstCall === 'true');

    let resultGetCandles;

    if (!isFirstCall) {
      resultGetCandles = await getCandles({
        instrumentId,
        startTime,
        interval,
        endTime,
        limit,
      });
    } else {
      const resultGetName = await getInstrumentName({
        instrumentId,
      });

      if (!resultGetName || !resultGetName.status) {
        return {
          status: false,
          message: resultGetName.message || 'Cant getInstrumentName',
        };
      }

      resultGetCandles = await getCandlesFromRedis({
        interval,
        instrumentId,
        instrumentName: resultGetName.result,
      });
    }

    if (!resultGetCandles || !resultGetCandles.status) {
      return res.json({
        status: false,
        message: resultGetCandles.message || 'Cant getCandles',
      });
    }

    return res.json({
      status: true,
      result: resultGetCandles.result || [],
    });
  } catch (error) {
    log.error(error.message);

    return res.json({
      status: false,
      message: error.message,
    });
  }
};
