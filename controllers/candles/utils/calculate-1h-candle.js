const moment = require('moment');

const {
  isMongoId,
} = require('validator');

const log = require('../../../libs/logger');
const redis = require('../../../libs/redis');

const {
  create1hCandle,
} = require('./create-1h-candle');

const Candle5m = require('../../../models/Candle-5m');

const calculate1hCandle = async ({
  instrumentId,
}) => {
  if (!instrumentId || !isMongoId(instrumentId.toString())) {
    return {
      status: false,
      message: 'No or invalid instrumentId',
    };
  }

  const startOfHour = moment().add(-10, 'minutes').startOf('hour');
  const endOfHour = moment(startOfHour).endOf('hour');

  const candlesDocs = await Candle5m
    .find({
      instrument_id: instrumentId,

      $and: [{
        time: { $lte: endOfHour },
      }, {
        time: { $gte: startOfHour },
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

  await create1hCandle({
    instrumentId,
    startTime: candlesDocs[0].time,
    open,
    close,
    high,
    low,
    volume: parseInt(sumVolume, 10),
  });

  if (!create1hCandle || !create1hCandle.status) {
    return {
      status: false,
      message: create1hCandle.message || 'Cant create1hCandle',
    };
  }

  return {
    status: true,
  };
};

module.exports = {
  calculate1hCandle,
};
