const moment = require('moment');

const {
  isMongoId,
} = require('validator');

const log = require('../../../libs/logger')(module);

const {
  create4hCandle,
} = require('./create-4h-candle');

const {
  updateCandlesInRedis,
} = require('./update-candles-in-redis');

const {
  INTERVALS,
} = require('../constants');

const Candle5m = require('../../../models/Candle-5m');

const calculate4hCandle = async ({
  instrumentId,
  // startTime,
}) => {
  try {
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

    const startOf4hPeriod = moment.unix(nowTimeUnix - secondsAfterPrevious4HInterval);
    const endOf4hPeriod = moment.unix(startOf4hPeriod.unix() + 14399);

    const candlesDocs = await Candle5m
      .find({
        instrument_id: instrumentId,

        $and: [{
          time: { $gte: startOf4hPeriod },
        }, {
          time: { $lte: endOf4hPeriod },
        }],
      })
      .sort({ time: 1 })
      .exec();

    if (!candlesDocs.length) {
      return {
        status: true,
      };
    }

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

    if (resultCreateCandle.isCreated) {
      const resultUpdate = await updateCandlesInRedis({
        instrumentId,
        interval: INTERVALS.get('4h'),
        newCandle: resultCreateCandle.result,
      });

      if (!resultUpdate || !resultUpdate.status) {
        log.warn(resultUpdate.message || 'Cant updateCandlesInRedis');
      }
    }

    return {
      status: true,
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
  calculate4hCandle,
};
