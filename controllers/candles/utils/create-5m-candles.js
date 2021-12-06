const {
  isUndefined,
} = require('lodash');

const log = require('../../../libs/logger')(module);

const {
  sendData,
} = require('../../../websocket/websocket-server');

const Candle5m = require('../../../models/Candle-5m');

const create5mCandles = async ({
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

    const result = await Candle5m.insertMany(arrToInsert);

    if (isFutures) {
      newCandles.forEach(newCandle => {
        sendData({
          actionName: 'candle5mData',
          data: {
            instrumentId: newCandle.instrumentId,
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
  create5mCandles,
};
