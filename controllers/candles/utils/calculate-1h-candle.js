const moment = require('moment');

const {
  isMongoId,
} = require('validator');

const log = require('../../../libs/logger');

const {
  create1hCandle,
} = require('./create-1h-candle');

const {
  updateCandlesInRedis,
} = require('./update-candles-in-redis');

const {
  INTERVALS,
} = require('../constants');

const Candle5m = require('../../../models/Candle-5m');

const calculate1hCandle = async ({
  instrumentId,
  // startTime,
}) => {
  if (!instrumentId || !isMongoId(instrumentId.toString())) {
    return {
      status: false,
      message: 'No or invalid instrumentId',
    };
  }

  const startOfHour = moment().utc().add(-10, 'minutes').startOf('hour');
  const endOfHour = moment(startOfHour).endOf('hour');

  const candlesDocs = await Candle5m
    .find({
      instrument_id: instrumentId,

      $and: [{
        time: { $gte: startOfHour },
      }, {
        time: { $lte: endOfHour },
      }],
    })
    .sort({ time: 1 })
    .exec();

  const open = candlesDocs[0].data[0];
  const close = candlesDocs[candlesDocs.length - 1].data[1];

  let sumVolume = 0;
  let high = candlesDocs[0].data[3];
  let low = candlesDocs[0].data[2];

  candlesDocs.forEach(candle => {
    if (candle.data[3] > high) {
      high = candle.data[3];
    }

    if (candle.data[2] < low) {
      low = candle.data[2];
    }

    sumVolume += candle.volume;
  });

  const resultCreateCandle = await create1hCandle({
    instrumentId,
    startTime: startOfHour,
    open,
    close,
    high,
    low,
    volume: parseInt(sumVolume, 10),
  });

  if (!resultCreateCandle || !resultCreateCandle.status) {
    return {
      status: false,
      message: resultCreateCandle.message || 'Cant create1hCandle',
    };
  }

  if (resultCreateCandle.isCreated) {
    const resultUpdate = await updateCandlesInRedis({
      instrumentId,
      interval: INTERVALS.get('1h'),
      newCandle: resultCreateCandle.result,
    });

    if (!resultUpdate || !resultUpdate.status) {
      log.warn(resultUpdate.message || 'Cant updateCandlesInRedis');
    }
  }

  return {
    status: true,
  };
};

module.exports = {
  calculate1hCandle,
};
