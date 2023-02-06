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

    const keyInstrumentCandles = `INSTRUMENT:${instrumentName}:CANDLES_${intervalWithUpperCase}`;
    let candlesDocs = await redis.getAsync(keyInstrumentCandles);

    if (candlesDocs) {
      return {
        status: true,
        result: JSON.parse(candlesDocs),
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

    candlesDocs = resultGetCandles.result;

    if (!candlesDocs || !candlesDocs.length) {
      return {
        status: true,
        result: [],
      };
    }

    candlesDocs = candlesDocs.map(candleDoc => ({
      data: candleDoc.data,
      volume: candleDoc.volume,
      time: candleDoc.time,
    }));

    await redis.setAsync([
      keyInstrumentCandles,
      JSON.stringify(candlesDocs),
    ]);

    return {
      status: true,
      result: candlesDocs,
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
