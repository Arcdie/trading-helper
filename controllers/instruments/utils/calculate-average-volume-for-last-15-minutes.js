const {
  isMongoId,
} = require('validator');

const log = require('../../../libs/logger');

const {
  updateInstrument,
} = require('./update-instrument');

const {
  sendData,
} = require('../../../websocket/websocket-server');

const {
  updateInstrumentInRedis,
} = require('./update-instrument-in-redis');

const Candle5m = require('../../../models/Candle-5m');

const calculateAverageVolumeForLast15Minutes = async ({
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

  const numberCandlesToGet = 3;

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

  let sumVolume = 0;
  for (let i = 0; i < candlesDocs.length; i += 1) {
    sumVolume += candlesDocs[i].volume;
  }

  if (sumVolume === 0) {
    return {
      status: true,
    };
  }

  const averageVolumeForLast15Minutes = Math.ceil(sumVolume / 3);

  await updateInstrument({
    instrumentId,
    averageVolumeForLast15Minutes,
  });

  await updateInstrumentInRedis({
    instrumentName,
    averageVolumeForLast15Minutes,
  });

  sendData({
    actionName: 'updateAverageVolume',
    data: {
      instrumentId,
      averageVolumeForLast15Minutes,
    },
  });

  return {
    status: true,
  };
};

module.exports = {
  calculateAverageVolumeForLast15Minutes,
};
