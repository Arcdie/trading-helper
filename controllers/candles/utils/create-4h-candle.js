const {
  isMongoId,
} = require('validator');

const log = require('../../../libs/logger');

const Candle4h = require('../../../models/Candle-4h');

const create4hCandle = async ({
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

  const existCandle = await Candle4h.findOne({
    instrument_id: instrumentId,
    time: startTime,
  }).exec();

  if (existCandle) {
    return {
      status: true,
      result: existCandle._doc,
    };
  }

  const newCandle = new Candle4h({
    instrument_id: instrumentId,

    data: [
      parseFloat(open),
      parseFloat(close),
      parseFloat(low),
      parseFloat(high),
    ],

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
  create4hCandle,
};
