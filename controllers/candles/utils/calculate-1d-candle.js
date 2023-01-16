const moment = require('moment');

const {
  isMongoId,
} = require('validator');

const log = require('../../../libs/logger')(module);

const {
  create1dCandles,
} = require('./create-1d-candles');

const {
  updateCandlesInRedis,
} = require('./update-candles-in-redis');

const {
  sendData,
} = require('../../../websocket/websocket-server');

const {
  INTERVALS,
} = require('../constants');

const Candle5m = require('../../../models/Candle-5m');

const calculate1dCandle = async ({
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

    const startOfDay = moment().utc().add(-10, 'minutes').startOf('day');
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

    const resultCreateCandle = await create1dCandles({
      // todo: fix
      isFutures: true,
      newCandles: [{
        instrumentId,
        startTime: startOfDay,
        open,
        close,
        high,
        low,
        volume: parseInt(sumVolume, 10),
      }],
    });

    if (!resultCreateCandle || !resultCreateCandle.status) {
      return {
        status: false,
        message: resultCreateCandle.message || 'Cant create1dCandle',
      };
    }

    if (resultCreateCandle.isCreated) {
      // todo: send data to websocket

      const resultUpdate = await updateCandlesInRedis({
        instrumentId,
        interval: INTERVALS.get('1d'),
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
  calculate1dCandle,
};
