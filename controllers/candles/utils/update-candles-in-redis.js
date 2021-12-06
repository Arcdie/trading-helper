const {
  isMongoId,
} = require('validator');

const redis = require('../../../libs/redis');
const log = require('../../../libs/logger')(module);

const {
  getUnix,
} = require('../../../libs/support');

const {
  getCandlesFromRedis,
} = require('./get-candles-from-redis');

const {
  getInstrumentName,
} = require('../../instruments/utils/get-instrument-name');

const {
  INTERVALS,
  LIMIT_CANDLES,
} = require('../constants');

const updateCandlesInRedis = async ({
  instrumentId,
  instrumentName,

  interval,
  newCandle,
}) => {
  try {
    if (!instrumentId || !isMongoId(instrumentId.toString())) {
      return {
        status: false,
        message: 'No or invalid instrumentId',
      };
    }

    if (!interval || !INTERVALS.get(interval)) {
      return {
        status: false,
        message: 'No or invalid interval',
      };
    }

    if (!newCandle) {
      return {
        status: false,
        message: 'No newCandle',
      };
    }

    if (!instrumentName) {
      const resultGetName = await getInstrumentName({
        instrumentId,
      });

      if (!resultGetName || !resultGetName.status) {
        return {
          status: false,
          message: resultGetName.message || 'Cant getInstrumentName',
        };
      }

      instrumentName = resultGetName.result;
    }

    const resultGetCandles = await getCandlesFromRedis({
      interval,
      instrumentId,
      instrumentName,
    });

    if (!resultGetCandles || !resultGetCandles.status) {
      const message = resultGetCandles.message || 'Cant getCandlesFromRedis';
      log.warn(message);

      return {
        status: false,
        message,
      };
    }

    const candlesDocs = resultGetCandles.result;

    const newCandleUnix = getUnix(newCandle.time);

    const doesExistDublicate = candlesDocs.some(candle => {
      const candleUnix = getUnix(candle.time);
      return newCandleUnix === candleUnix;
    });

    if (doesExistDublicate) {
      return { status: true };
    }

    candlesDocs.unshift({
      data: newCandle.data,
      volume: newCandle.volume,
      time: newCandle.time,
    });

    const lCandles = candlesDocs.length;

    if (lCandles > LIMIT_CANDLES) {
      for (let i = 0; i < lCandles - LIMIT_CANDLES; i += 1) {
        candlesDocs.pop();
      }
    }

    const intervalWithUpperCase = interval.toUpperCase();
    const keyInstrumentCandles = `INSTRUMENT:${instrumentName}:CANDLES_${intervalWithUpperCase}`;

    await redis.setAsync([
      keyInstrumentCandles,
      JSON.stringify(candlesDocs),
    ]);

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
  updateCandlesInRedis,
};
