const moment = require('moment');

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

const Candle5m = require('../../../models/Candle-5m');
const InstrumentNew = require('../../../models/InstrumentNew');

const updateAverageVolume = async ({
  instrumentId,
  instrumentName,
  isUpdateForLast24Hours,
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

  let numberCandlesToGet = 3;

  if (isUpdateForLast24Hours) {
    numberCandlesToGet = ((24 * 60) / 5);
  }

  const candlesDocs = await Candle5m
    .find({
      instrument_id: instrumentId,
      // time: { $gte: dayBefore },
    }, { volume: 1 })
    .sort({ time: -1 })
    .limit(numberCandlesToGet)
    .exec();

  if (!candlesDocs || !candlesDocs.length) {
    log.warn(`No candles for ${instrumentName}`);

    return {
      status: true,
    };
  }

  let sumVolumes = 0;
  let averageVolumeForLast24Hours = false;
  let averageVolumeForLast15Minutes = false;

  if (isUpdateForLast24Hours) {
    const sortedCandles = candlesDocs.sort((a, b) => {
      if (a.volume > b.volume) return -1;
      return 1;
    });

    for (let i = 0; i < LIMITER_FOR_AVERAGE_VOLUME; i += 1) {
      sumVolumes += sortedCandles[i].volume;
    }

    averageVolumeForLast24Hours = Math.ceil(sumVolumes / LIMITER_FOR_AVERAGE_VOLUME);
  } else {
    for (let i = 0; i < candlesDocs.length; i += 1) {
      sumVolumes += candlesDocs[i].volume;
    }

    averageVolumeForLast15Minutes = Math.ceil(sumVolumes / 3);
  }

  if (sumVolumes === 0) {
    return {
      status: true,
    };
  }

  await updateInstrument({
    instrumentId,
    averageVolumeForLast24Hours,
    averageVolumeForLast15Minutes,
  });

  const resultUpdate = await updateInstrumentInRedis({
    instrumentName,
    averageVolumeForLast24Hours,
    averageVolumeForLast15Minutes,
  });

  if (!resultUpdate || !resultUpdate.status) {
    return {
      status: false,
      message: resultUpdate.message || 'Cant updateInstrumentInRedis',
    };
  }

  const updatedDoc = resultUpdate.result;

  averageVolumeForLast24Hours = updatedDoc.average_volume_for_last_24_hours;
  averageVolumeForLast15Minutes = updatedDoc.average_volume_for_last_15_minutes;

  sendData({
    actionName: 'updateAverageVolume',
    data: {
      instrumentId,
      averageVolumeForLast24Hours,
      averageVolumeForLast15Minutes,
    },
  });

  return {
    status: true,
  };
};

module.exports = {
  updateAverageVolume,
};
