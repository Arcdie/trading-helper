const {
  isMongoId,
} = require('validator');

const {
  getCandles,
} = require('./get-candles');

const redis = require('../../../libs/redis');
const log = require('../../../libs/logger')(module);

const {
  INTERVALS,
  LIMIT_CANDLES_STORAGE_IN_REDIS,
} = require('../constants');

const getCandlesFromRedis = async ({
  instrumentId,
  instrumentName,
  interval,
}) => {
  try {
    if (!instrumentId || !isMongoId(instrumentId.toString())) {
      return {
        status: false,
        message: 'No or invalid instrumentId',
      };
    }

    if (!instrumentName) {
      return {
        status: false,
        message: 'No instrumentName',
      };
    }

    if (!interval || !INTERVALS.get(interval)) {
      return {
        status: false,
        message: 'No or invalid interval',
      };
    }

    const intervalWithUpperCase = interval.toUpperCase();
    const keyInstrumentCandles = `INSTRUMENT:${instrumentName}:CANDLES_${intervalWithUpperCase}_NEW`;

    const data = await redis.lrangeAsync(keyInstrumentCandles, 0, 9999);
    let candles = data.map(e => JSON.parse(e));

    if (candles.length) {
      return {
        status: true,
        result: candles,
      };

      // return {
      //   status: true,
      //   result: parsedCandles.map(candle => ({
      //     instrument_id: instrumentId,
      //     ...candle,
      //   })),
      // };
    }

    const resultGetCandles = await getCandles({
      interval,
      instrumentId,
      limit: LIMIT_CANDLES_STORAGE_IN_REDIS,
      endTime: new Date().toISOString(),
    });

    if (!resultGetCandles || !resultGetCandles.status) {
      return {
        status: false,
        message: resultGetCandles.message || 'Cant getCandles',
      };
    }

    if (!resultGetCandles.result || !resultGetCandles.result.length) {
      return {
        status: true,
        result: [],
      };
    }

    candles = resultGetCandles.result.map(candleDoc => ({
      data: candleDoc.data,
      volume: candleDoc.volume,
      time: candleDoc.time,
    }));

    await redis.lpushAsync(
      keyInstrumentCandles,
      candles.map(candle => JSON.stringify(candle)),
    );

    return {
      status: true,
      result: candles,
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
  getCandlesFromRedis,
};
