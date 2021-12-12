const log = require('../../../libs/logger')(module);

const {
  updateInstrument,
} = require('../utils/update-instrument');

const {
  updateInstrumentInRedis,
} = require('../utils/update-instrument-in-redis');

const {
  getActiveInstruments,
} = require('../../instruments/utils/get-active-instruments');

const {
  getCandlesFromRedis,
} = require('../../candles/utils/get-candles-from-redis');

const {
  sendData,
} = require('../../../websocket/websocket-server');

const {
  INTERVALS,
} = require('../../candles/constants');

module.exports = async (req, res, next) => {
  try {
    res.json({
      status: true,
    });

    const resultGetInstruments = await getActiveInstruments({});

    if (!resultGetInstruments || !resultGetInstruments.status) {
      log.warn(resultGetInstruments.message || 'Cant getActiveInstruments');
      return false;
    }

    const numberRequiredCandles = 3;

    for await (const instrumentDoc of resultGetInstruments.result) {
      const resultGetCandles = await getCandlesFromRedis({
        instrumentId: instrumentDoc._id,
        instrumentName: instrumentDoc.name,
        interval: INTERVALS.get('5m'),
      });

      if (!resultGetCandles || !resultGetCandles.status) {
        log.warn(resultGetCandles.message || 'Cant getCandlesFromRedis');
        continue;
      }

      const candlesDocs = resultGetCandles.result;

      if (!candlesDocs || candlesDocs.length < numberRequiredCandles) {
        continue;
      }

      const targetCandlesDocs = candlesDocs.slice(0, numberRequiredCandles + 1);

      let sumVolume = 0;
      targetCandlesDocs.forEach(doc => {
        sumVolume += doc.volume;
      });

      if (sumVolume === 0) {
        continue;
      }

      const averageVolumeForLast15Minutes = Math.ceil(sumVolume / numberRequiredCandles);

      await updateInstrument({
        averageVolumeForLast15Minutes,
        instrumentId: instrumentDoc._id,
      });

      await updateInstrumentInRedis({
        averageVolumeForLast15Minutes,
        instrumentName: instrumentDoc.name,
      });

      sendData({
        actionName: 'updateAverageVolume',
        data: {
          averageVolumeForLast15Minutes,
          instrumentId: instrumentDoc._id,
        },
      });
    }
  } catch (error) {
    log.warn(error.message);
    return false;
  }
};
