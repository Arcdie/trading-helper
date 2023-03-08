const {
  isMongoId,
} = require('validator');

const redis = require('../../../libs/redis');
const log = require('../../../libs/logger')(module);

const {
  getInstrumentName,
} = require('../../instruments/utils/get-instrument-name');

const {
  INTERVALS,
  LIMIT_CANDLES_STORAGE_IN_REDIS,
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

    const intervalWithUpperCase = interval.toUpperCase();
    const keyInstrumentCandles = `INSTRUMENT:${instrumentName}:CANDLES_${intervalWithUpperCase}`;

    const lCandles = await redis.llenAsync(keyInstrumentCandles);

    if (lCandles > LIMIT_CANDLES_STORAGE_IN_REDIS) {
      const iterations = [...Array(lCandles - LIMIT_CANDLES_STORAGE_IN_REDIS).keys()];

      for await (const i of iterations) {
        await redis.lpopAsync(keyInstrumentCandles);
      }
    }

    await redis.lpushAsync(
      keyInstrumentCandles,
      [JSON.stringify({
        data: newCandle.data,
        volume: newCandle.volume,
        time: newCandle.time,
      })],
    );

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
