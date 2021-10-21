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
  let cacheInstrumentVolumeDoc = await redis.getAsync(keyInstrumentVolume);

  if (!cacheInstrumentDoc) {
    log.warn(`No cacheInstrumentDoc doc; instrumentName: ${instrumentName}`);
    return null;
  }

  if (!cacheInstrumentVolumeDoc) {
    log.warn(`No cacheInstrumentVolumeDoc doc; instrumentName: ${instrumentName}`);
    return null;
  }

  cacheInstrumentDoc = JSON.parse(cacheInstrumentDoc);
  cacheInstrumentVolumeDoc = JSON.parse(cacheInstrumentVolumeDoc);

  let sumVolumeForLast15Minutes = 0;

  arrSeries.forEach(timestamp => {
    const element = cacheInstrumentVolumeDoc.find(
      element => element.timestamp === timestamp,
    );

    if (!element) {
      return true;
    }

    sumVolumeForLast15Minutes += element.quantity;
  });

  cacheInstrumentDoc.average_volume_for_last_15_minutes = sumVolumeForLast15Minutes / (15 / 5);

  await updateInstrument({
    instrumentId,
    averageVolumeForLast15Minutes: cacheInstrumentDoc.average_volume_for_last_15_minutes,
  });

  await updateInstrumentInRedis({
    instrumentName,
    averageVolumeForLast15Minutes: cacheInstrumentDoc.average_volume_for_last_15_minutes,
  });

  return {
    status: true,
  };
};

module.exports = {
  updateAverageVolume,
};
