const {
  isMongoId,
} = require('validator');

const {
  isUndefined,
} = require('lodash');

const {
  sendData,
} = require('../../../websocket/websocket-server');

const Candle5m = require('../../../models/Candle-5m');

const create5mCandles = async ({
  instrumentId,
  isFutures,

  newCandles,
}) => {
  if (!instrumentId || !isMongoId(instrumentId.toString())) {
    return {
      status: false,
      message: 'No or invalid instrumentId',
    };
  }

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
      instrument_id: instrumentId,

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

  await Candle5m.insertMany(arrToInsert);

  if (isFutures) {
    newCandles.forEach(newCandle => {
      sendData({
        actionName: 'candle5mData',
        data: {
          instrumentId,
          startTime: new Date(newCandle.startTime).getTime(),
          open: newCandle.open,
          close: newCandle.close,
          high: newCandle.high,
          low: newCandle.low,
          volume: newCandle.volume,
        },
      });
    });
  }

  return {
    status: true,
  };
};

module.exports = {
  create5mCandles,
};
