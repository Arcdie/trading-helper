const {
  isMongoId,
} = require('validator');

const {
  isUndefined,
} = require('lodash');

const {
  sendData,
} = require('../../../websocket/websocket-server');

const Candle1m = require('../../../models/Candle-1m');

const create1mCandle = async ({
  instrumentId,
  isFutures,

  startTime,
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

  if (isUndefined(isFutures)) {
    return {
      status: false,
      message: 'No isFutures',
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

  open = parseFloat(open);
  close = parseFloat(close);
  high = parseFloat(high);
  low = parseFloat(low);
  volume = parseInt(volume, 10);

  const newCandle = new Candle1m({
    instrument_id: instrumentId,
    data: [open, close, low, high],

    volume,
    time: startTime,
  });

  await newCandle.save();

  return {
    status: true,
    result: newCandle._doc,
  };
};

module.exports = {
  create1mCandle,
};
