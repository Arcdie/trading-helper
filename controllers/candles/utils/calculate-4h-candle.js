const moment = require('moment');

const {
  isMongoId,
} = require('validator');

const log = require('../../../libs/logger');
const redis = require('../../../libs/redis');

const {
  create4hCandle,
} = require('./create-4h-candle');

const Candle5m = require('../../../models/Candle-5m');

const calculate4hCandle = async ({
  instrumentId,
}) => {
  if (!instrumentId || !isMongoId(instrumentId.toString())) {
    return {
      status: false,
      message: 'No or invalid instrumentId',
    };
  }

  const nowTimeUnix = moment().unix();
  const startCurrentDayUnix = moment().utc().startOf('day').unix();

  const differenceBetweenNowAndStartToday = nowTimeUnix - startCurrentDayUnix;
  const secondsAfterPrevious4HInterval = differenceBetweenNowAndStartToday % 14400;

  const startOf4hPeriod = moment.unix(nowTimeUnix - secondsAfterPrevious4HInterval - 14400);
  const endOf4hPeriod = moment.unix(startOf4hPeriod + 14399);

  const candlesDocs = await Candle5m
    .find({
      instrument_id: instrumentId,

      $and: [{
        time: { $lte: endOf4hPeriod },
      }, {
        time: { $gte: startOf4hPeriod },
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

  const resultCreateCandle = await create4hCandle({
    instrumentId,
    startTime: startOf4hPeriod,
    open,
    close,
    high,
    low,
    volume: parseInt(sumVolume, 10),
  });

  if (!resultCreateCandle || !resultCreateCandle.status) {
    return {
      status: false,
      message: resultCreateCandle.message || 'Cant create4hCandle',
    };
  }

  return {
    status: true,
  };
};

module.exports = {
  calculate4hCandle,
};
