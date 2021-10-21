const {
  isMongoId,
} = require('validator');

const {
  isUndefined,
} = require('lodash');

const log = require('../../../libs/logger');
const redis = require('../../../libs/redis');

const {
  sendData,
} = require('../../../services/websocket-server');

const {
  createInstrumentVolumeBound,
} = require('./create-instrument-volume-bound');

const {
  updateInstrumentVolumeBound,
} = require('./update-instrument-volume-bound');

const InstrumentVolumeBound = require('../../../models/InstrumentVolumeBound');

const checkInstrumentVolumeBounds = async ({
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

  const keyInstrument = `INSTRUMENT:${instrumentName}`;
  const keyInstrumentAsks = `INSTRUMENT:${instrumentName}:ASKS`;
  const keyInstrumentBids = `INSTRUMENT:${instrumentName}:BIDS`;
  const keyInstrumentVolumeBounds = `INSTRUMENT:${instrumentName}:VOLUME_BOUNDS`;

  let cacheInstrumentDoc = await redis.getAsync(keyInstrument);
  let cacheInstrumentAsks = await redis.getAsync(keyInstrumentAsks);
  let cacheInstrumentBids = await redis.getAsync(keyInstrumentBids);
  let cacheInstrumentVolumeBounds = await redis.getAsync(keyInstrumentVolumeBounds);

  if (!cacheInstrumentDoc) {
    log.warn(`No cacheInstrumentDoc doc; instrumentName: ${instrumentName}`);
    return null;
  }

  cacheInstrumentDoc = JSON.parse(cacheInstrumentDoc);

  if (!cacheInstrumentAsks) {
    cacheInstrumentAsks = [];
  } else {
    cacheInstrumentAsks = JSON.parse(cacheInstrumentAsks);
  }

  if (!cacheInstrumentBids) {
    cacheInstrumentBids = [];
  } else {
    cacheInstrumentBids = JSON.parse(cacheInstrumentBids);
  }

  if (!cacheInstrumentVolumeBounds) {
    cacheInstrumentVolumeBounds = [];
  } else {
    cacheInstrumentVolumeBounds = JSON.parse(cacheInstrumentVolumeBounds);
  }

  let wereChangedInstrumentVolumeBounds = false;
  const averageVolumeForLast15Minutes = cacheInstrumentDoc.average_volume_for_last_15_minutes || 0;

  await Promise.all(cacheInstrumentAsks.map(async ([price, quantity]) => {
    if (averageVolumeForLast15Minutes === 0) {
      return null;
    }

    if (quantity >= averageVolumeForLast15Minutes) {
      const doesExistBound = cacheInstrumentVolumeBounds.some(
        bound => bound.price === price && bound.isAsk === true,
      );

      if (!doesExistBound) {
        const resultCreate = await createInstrumentVolumeBound({
          instrumentId,
          price: parseFloat(price),
          quantity: parseFloat(quantity),
          averageVolumeForLast15Minutes,
          isAsk: true,
        });

        if (!resultCreate || !resultCreate.status) {
          const message = resultCreate.message || 'Cant createInstrumentVolumeBound';
          log.warn(message);
          return null;
        }

        wereChangedInstrumentVolumeBounds = true;
        resultCreate.result.instrument_name = instrumentName;
        cacheInstrumentVolumeBounds.push(resultCreate.result);

        sendData({
          actionName: 'newInstrumentVolumeBound',
          data: resultCreate.result,
        });
      }
    }
  }));

  await Promise.all(cacheInstrumentBids.map(async ([price, quantity]) => {
    if (averageVolumeForLast15Minutes === 0) {
      return null;
    }

    if (quantity >= averageVolumeForLast15Minutes) {
      const doesExistBound = cacheInstrumentVolumeBounds.some(
        bound => bound.price === price && bound.isAsk === false,
      );

      if (!doesExistBound) {
        const resultCreate = await createInstrumentVolumeBound({
          instrumentId,
          price: parseFloat(price),
          quantity: parseFloat(quantity),
          averageVolumeForLast15Minutes,
          isAsk: false,
        });

        if (!resultCreate || !resultCreate.status) {
          const message = resultCreate.message || 'Cant createInstrumentVolumeBound';
          log.warn(message);
          return null;
        }

        wereChangedInstrumentVolumeBounds = true;
        resultCreate.result.instrument_name = instrumentName;
        cacheInstrumentVolumeBounds.push(resultCreate.result);

        sendData({
          actionName: 'newInstrumentVolumeBound',
          data: resultCreate.result,
        });
      }
    }
  }));

  const commonArr = [...cacheInstrumentAsks, ...cacheInstrumentBids];

  await Promise.all(cacheInstrumentVolumeBounds.map(async bound => {
    const existElement = commonArr.find(element => element[0] === bound.price);

    if (!existElement
      || existElement[1] < bound.average_volume_for_last_15_minutes) {
      const resultUpdate = await updateInstrumentVolumeBound({
        boundId: bound._id,

        isActive: false,
      });

      if (!resultUpdate || !resultUpdate.status) {
        const message = resultUpdate.message || 'Cant updateInstrumentVolumeBound';
        log.warn(message);
        return null;
      }

      wereChangedInstrumentVolumeBounds = true;

      cacheInstrumentVolumeBounds = cacheInstrumentVolumeBounds.filter(
        targetBound => targetBound._id.toString() !== bound._id.toString(),
      );

      sendData({
        actionName: 'deactivateInstrumentVolumeBound',
        data: bound,
      });
    }
  }));

  if (wereChangedInstrumentVolumeBounds) {
    await redis.setAsync([
      keyInstrumentVolumeBounds,
      JSON.stringify(cacheInstrumentVolumeBounds),
    ]);
  }

  return {
    status: true,
  };
};

module.exports = {
  checkInstrumentVolumeBounds,
};
