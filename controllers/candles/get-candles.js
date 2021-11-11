const moment = require('moment');

const {
  isMongoId,
} = require('validator');

const {
  getCandles,
} = require('./utils/get-candles');

module.exports = async (req, res, next) => {
  const {
    params: {
      interval,
    },

    query: {
      instrumentId,
      startTime,
      endTime,
      limit,
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

  if (!interval || !['1m', '5m', '1h', '4h', '1d'].includes(interval)) {
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

  const resultGetCandles = await getCandles({
    instrumentId,
    startTime,
    interval,
    endTime,
    limit,
  });

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
};
