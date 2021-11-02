const log = require('../../../libs/logger');

const {
  getActiveInstruments,
} = require('../../instruments/utils/get-active-instruments');

const {
  updateInstrument,
} = require('../utils/update-instrument');

const {
  updateInstrumentInRedis,
} = require('../utils/update-instrument-in-redis');

const {
  sendData,
} = require('../../../websocket/websocket-server');

const {
  LIMITER_FOR_AVERAGE_VOLUME,
} = require('../constants');

const Candle1m = require('../../../models/Candle-1m');

module.exports = async (req, res, next) => {
  const resultGetInstruments = await getActiveInstruments({});

  if (!resultGetInstruments || !resultGetInstruments.status) {
    return res.json({
      status: false,
      message: resultGetInstruments.message || 'Cant getActiveInstruments',
    });
  }

  for (const instrumentDoc of resultGetInstruments.result) {
    const numberCandlesToGet = 24 * 60;

    const candlesDocs = await Candle1m
      .find({
        instrument_id: instrumentDoc._id,
        // time: { $gte: dayBefore },
      }, { volume: 1 })
      .sort({ time: -1 })
      .limit(numberCandlesToGet)
      .exec();

    if (!candlesDocs || !candlesDocs.length) {
      log.warn(`No candles for ${instrumentDoc.name}`);
      continue;
    }

    const sortedCandles = candlesDocs.sort((a, b) => {
      if (a.volume > b.volume) return -1;
      return 1;
    });

    let sumVolume = 0;
    for (let i = 0; i < LIMITER_FOR_AVERAGE_VOLUME; i += 1) {
      sumVolume += sortedCandles[i].volume;
    }

    if (sumVolume === 0) {
      continue;
    }

    const averageVolumeForLast24Hours = Math.ceil(sumVolume / LIMITER_FOR_AVERAGE_VOLUME);

    await updateInstrument({
      instrumentId: instrumentDoc._id,
      averageVolumeForLast24Hours,
    });

    await updateInstrumentInRedis({
      instrumentName: instrumentDoc.name,
      averageVolumeForLast24Hours,
    });

    sendData({
      actionName: 'updateAverageVolume',
      data: {
        instrumentId: instrumentDoc._id,
        averageVolumeForLast24Hours,
      },
    });
  }

  return res.json({
    status: true,
  });
};
