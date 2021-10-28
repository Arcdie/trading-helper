const {
  isMongoId,
} = require('validator');

const log = require('../../../libs/logger');
const redis = require('../../../libs/redis');

const Candle = require('../../../models/Candle');

const updateCandleInRedis = async ({
  instrumentId,
  instrumentName,
  startTime,
  open,
  close,
  high,
  low,
  volume,
}) => {
  if (instrumentId && !isMongoId(instrumentId.toString())) {
    return {
      status: false,
      message: 'Invalid instrumentId',
    };
  }

  if (!instrumentId && !instrumentName) {
    return {
      status: false,
      message: 'No instrumentId and instrumentName',
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

  if (instrumentName) {
    const keyInstrument = `INSTRUMENT:${instrumentName}`;
    let cacheInstrumentDoc = await redis.getAsync(keyInstrument);

    if (!cacheInstrumentDoc) {
      const message = `No cacheInstrumentDoc doc; instrumentName: ${instrumentName}`;
      log.warn(message);

      return {
        status: false,
        message,
      };
    }

    cacheInstrumentDoc = JSON.parse(cacheInstrumentDoc);
    instrumentId = cacheInstrumentDoc._id;
  }

  const existCandle = await Candle.findOne({
    instrument_id: instrumentId,
    time: startTime,
  }).exec();

  if (existCandle) {
    return {
      status: true,
      result: existCandle._doc,
    };
  }

  const newCandle = new Candle({
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
  createCandle,
};
