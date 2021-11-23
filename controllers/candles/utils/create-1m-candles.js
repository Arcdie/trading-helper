const {
  isUndefined,
} = require('lodash');

const Candle1m = require('../../../models/Candle-1m');

const create1mCandles = async ({
  isFutures,
  newCandles,
}) => {
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

  await Candle1m.insertMany(arrToInsert);
};

module.exports = {
  create1mCandles,
};
