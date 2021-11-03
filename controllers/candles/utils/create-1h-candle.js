const {
  isEmpty,
} = require('lodash');

const {
  isMongoId,
} = require('validator');

const Candle1h = require('../../../models/Candle-1h');

const create1hCandle = async ({
  instrumentId,
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

  const existCandle = await Candle1h.findOne({
    instrument_id: instrumentId,
    time: startTime,
  }).exec();

  if (existCandle) {
    const updateObj = {};

    if (high > existCandle.high) {
      updateObj.high = high;
    }

    if (low < existCandle.low) {
      updateObj.low = low;
    }

    if (close !== existCandle.close) {
      updateObj.close = close;
    }

    if (!isEmpty(updateObj)) {
      await Candle1h.findByIdAndUpdate(existCandle._id, updateObj).exec();
    }

    return {
      status: true,
      result: existCandle._doc,
    };
  }

  const newCandle = new Candle1h({
    instrument_id: instrumentId,
    data: [open, close, low, high],
    volume: parseFloat(volume),
    time: startTime,
  });

  await newCandle.save();

  return {
    status: true,
    result: newCandle._doc,
  };
};

module.exports = {
  create1hCandle,
};
