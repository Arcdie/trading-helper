const {
  isMongoId,
} = require('validator');

const {
  sendData,
} = require('../../../websocket/websocket-server');

const Candle5m = require('../../../models/Candle-5m');

const create5mCandle = async ({
  instrumentId,
  startTime,
  isFutures,
  open,
  close,
  high,
  low,
  volume,
}) => {
  if (!instrumentId || !isMongoId(instrumentId.toString())) {
    return {
      status: false,
      message: 'No or invalid instrumentId',
    };
  }

  if (!startTime) {
    return {
      status: false,
      message: 'No startTime',
    };
  }

  if (!open) {
    return {
      status: false,
      message: 'No open',
    };
  }

  if (!close) {
    return {
      status: false,
      message: 'No close',
    };
  }

  if (!high) {
    return {
      status: false,
      message: 'No high',
    };
  }

  if (!low) {
    return {
      status: false,
      message: 'No low',
    };
  }

  if (!volume) {
    return {
      status: false,
      message: 'No volume',
    };
  }

  const existCandle = await Candle5m.findOne({
    instrument_id: instrumentId,
    time: startTime,
  }).exec();

  if (existCandle) {
    return {
      status: true,
      result: existCandle._doc,
    };
  }

  open = parseFloat(open);
  close = parseFloat(close);
  high = parseFloat(high);
  low = parseFloat(low);
  volume = parseFloat(volume);

  const newCandle = new Candle5m({
    instrument_id: instrumentId,
    data: [open, close, low, high],

    volume,
    time: startTime,
  });

  await newCandle.save();

  if (isFutures) {
    sendData({
      actionName: 'candle5mData',
      data: {
        instrumentId,
        startTime,
        open,
        close,
        high,
        low,
        volume,
      },
    });
  }

  return {
    status: true,
    result: newCandle._doc,
  };
};

module.exports = {
  create5mCandle,
};
