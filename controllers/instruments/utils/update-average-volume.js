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
} = require('../../../services/websocket-server');

const {
  updateInstrumentInRedis,
} = require('./update-instrument-in-redis');

const InstrumentNew = require('../../../models/InstrumentNew');

const updateAverageVolume = async ({
  instrumentId,
  instrumentName,

  arrSeries,
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

  if (!arrSeries || !Array.isArray(arrSeries) || !arrSeries.length) {
    return {
      status: false,
      message: 'No or invalid arrSeries',
    };
  }

  const keyInstrument = `INSTRUMENT:${instrumentName}`;
  const keyInstrumentVolume = `INSTRUMENT:${instrumentName}:VOLUME`;

  let cacheInstrumentDoc = await redis.getAsync(keyInstrument);
  let cacheVolumeValues = await redis.hmgetAsync(keyInstrumentVolume, arrSeries);

  if (!cacheInstrumentDoc) {
    log.warn(`No cacheInstrumentDoc doc; instrumentName: ${instrumentName}`);
    return null;
  }

  if (!cacheVolumeValues) {
    cacheVolumeValues = [];
  }

  cacheInstrumentDoc = JSON.parse(cacheInstrumentDoc);

  let sumVolumeForLast15Minutes = 0;

  arrSeries.forEach((timestamp, index) => {
    const quantity = cacheVolumeValues[index];

    if (!quantity) {
      return true;
    }

    sumVolumeForLast15Minutes += parseFloat(quantity);
  });

  cacheInstrumentDoc.average_volume_for_last_15_minutes = parseInt(sumVolumeForLast15Minutes / (15 / 5), 10);

  await updateInstrument({
    instrumentId,
    averageVolumeForLast15Minutes: cacheInstrumentDoc.average_volume_for_last_15_minutes,
  });

  await updateInstrumentInRedis({
    instrumentName,
    averageVolumeForLast15Minutes: cacheInstrumentDoc.average_volume_for_last_15_minutes,
  });

  sendData({
    actionName: 'updateAverageVolume',
    data: {
      instrumentId,
      averageVolumeForLast15Minutes: cacheInstrumentDoc.average_volume_for_last_15_minutes,
    },
  });

  return {
    status: true,
  };
};

module.exports = {
  updateAverageVolume,
};
