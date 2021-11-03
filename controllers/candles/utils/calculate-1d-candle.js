const moment = require('moment');

const {
  isMongoId,
} = require('validator');

const {
  create1dCandle,
} = require('./create-1d-candle');

const Candle5m = require('../../../models/Candle-5m');

const calculate1dCandle = async ({
  instrumentId,
}) => {
  if (!instrumentId || !isMongoId(instrumentId.toString())) {
    return {
      status: false,
      message: 'No or invalid instrumentId',
    };
  }

  const startOfDay = moment().utc().startOf('day');
  const endOfDay = moment(startOfDay).endOf('day');

  const candlesDocs = await Candle5m
    .find({
      instrument_id: instrumentId,

      $and: [{
        time: { $gte: startOfDay },
      }, {
        time: { $lte: endOfDay },
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

  const resultCreateCandle = await create1dCandle({
    instrumentId,
    startTime: startOfDay,
    open,
    close,
    high,
    low,
    volume: parseInt(sumVolume, 10),
  });

  if (!resultCreateCandle || !resultCreateCandle.status) {
    return {
      status: false,
      message: resultCreateCandle.message || 'Cant create1dCandle',
    };
  }

  return {
    status: true,
  };
};

module.exports = {
  calculate1dCandle,
};
