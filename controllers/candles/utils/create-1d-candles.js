const {
  isUndefined,
} = require('lodash');

const log = require('../../../libs/logger')(module);

const Candle1d = require('../../../models/Candle-1d');

const create1dCandles = async ({
  isFutures,
  newCandles,
}) => {
  try {
    if (isUndefined(isFutures)) {
      return {
        status: false,
        message: 'No isFutures',
      };
    }

    if (!newCandles || !newCandles.length) {
      return {
        status: false,
        message: 'No or empty newCandles',
      };
    }

    const arrToInsert = [];

    newCandles.forEach(newCandle => {
      newCandle.open = parseFloat(newCandle.open);
      newCandle.close = parseFloat(newCandle.close);
      newCandle.high = parseFloat(newCandle.high);
      newCandle.low = parseFloat(newCandle.low);
      newCandle.volume = parseInt(newCandle.volume, 10);

      arrToInsert.push({
        instrument_id: newCandle.instrumentId,

        data: [
          newCandle.open,
          newCandle.close,
          newCandle.low,
          newCandle.high,
        ],

        volume: newCandle.volume,
        time: newCandle.startTime,
      });
    });

    const result = await Candle1d.insertMany(arrToInsert);

    return {
      result,
      status: true,
      isCreated: true,
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
  create1dCandles,
};
