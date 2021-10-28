const {
  isEmpty,
} = require('lodash');

const {
  isMongoId,
} = require('validator');

const log = require('../../../libs/logger');
const redis = require('../../../libs/redis');

const {
  updateInstrument,
} = require('./update-instrument');

const {
  sendData,
} = require('../../../websocket/websocket-server');

const {
  updateInstrumentInRedis,
} = require('./update-instrument-in-redis');

const {
  LIMITER_FOR_AVERAGE_VOLUME,
} = require('../constants');

const Candle = require('../../../models/Candle');
const InstrumentNew = require('../../../models/InstrumentNew');

const updateAverageVolume = async ({
  instrumentId,
  instrumentName,
}) => {
  if (!instrumentId || !isMongoId(instrumentId.toString())) {
    return {
      status: false,
      message: 'No or invalid instrumentId',
    };
  }

  if (!instrumentName) {
    return {
      status: false,
      message: 'No or invalid instrumentName',
    };
  }

  const candlesDocs = await Candle
    .find({
      instrument_id: instrumentId,
      // time: { $gte: dayBefore }, replace logic after some time
    }, { volume: 1 })
    .sort({ time: -1 })
    .limit(1440)
    .exec();

  if (!candlesDocs || !candlesDocs.length) {
    log.warn(`No candles for ${instrumentName}`);

    return {
      status: true,
    };
  }

  const sortedCandles = candlesDocs.sort((a, b) => {
    if (a.volume > b.volume) return -1;
    return 1;
  });

  let sumVolumes = 0;

  for (let i = 0; i < LIMITER_FOR_AVERAGE_VOLUME; i += 1) {
    sumVolumes += sortedCandles[i].volume;
  }

  if (sumVolumes === 0) {
    return {
      status: true,
    };
  }

  const averageVolume = Math.ceil(sumVolumes / LIMITER_FOR_AVERAGE_VOLUME);

  await updateInstrument({
    instrumentId,
    averageVolume,
  });

  await updateInstrumentInRedis({
    instrumentName,
    averageVolume,
  });

  sendData({
    actionName: 'updateAverageVolume',
    data: {
      instrumentId,
      averageVolume,
    },
  });

  return {
    status: true,
  };
};

module.exports = {
  updateAverageVolume,
};
