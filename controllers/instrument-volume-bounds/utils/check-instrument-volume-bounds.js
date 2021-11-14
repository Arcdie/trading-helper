const moment = require('moment');

const log = require('../../../libs/logger');
const redis = require('../../../libs/redis');

const {
  updateInstrumentVolumeBound,
} = require('./update-instrument-volume-bound');

const {
  createInstrumentVolumeBound,
} = require('./create-instrument-volume-bound');

const {
  sendData,
} = require('../../../websocket/websocket-server');

const {
  LIMITER_RANGE_FOR_LIMIT_ORDERS,
} = require('../constants');

const checkInstrumentVolumeBounds = async ({
  asks,
  bids,
  instrumentName,
}) => {
  if (!instrumentName) {
    return {
      status: false,
      message: 'No instrumentName',
    };
  }

  if (!asks || !Array.isArray(asks)) {
    return {
      status: false,
      message: 'No or invalid asks',
    };
  }

  if (!bids || !Array.isArray(bids)) {
    return {
      status: false,
      message: 'No or invalid bids',
    };
  }

  const keyInstrument = `INSTRUMENT:${instrumentName}`;
  const keyInstrumentVolumeBounds = `INSTRUMENT:${instrumentName}:VOLUME_BOUNDS`;

  const fetchDataPromises = [
    redis.getAsync(keyInstrument),
    redis.hkeysAsync(keyInstrumentVolumeBounds),
  ];

  let [
    cacheInstrumentDoc,
    cacheInstrumentVolumeBoundsKeys,
  ] = await Promise.all(fetchDataPromises);

  if (!cacheInstrumentDoc) {
    return {
      status: false,
      message: `No cacheInstrumentDoc doc; instrumentName: ${instrumentName}`,
    };
  }

  cacheInstrumentDoc = JSON.parse(cacheInstrumentDoc);

  const halfOfAverageVolumeForLast24Hours = Math.ceil(cacheInstrumentDoc.average_volume_for_last_24_hours / 2);

  if (!cacheInstrumentVolumeBoundsKeys) {
    cacheInstrumentVolumeBoundsKeys = [];
  }

  const needValuesForKeys = [];

  asks = asks.map(ask => {
    let [price, quantity] = ask;

    price = parseFloat(price);
    quantity = parseFloat(quantity);

    const doesExistBound = cacheInstrumentVolumeBoundsKeys.some(key => parseFloat(key) === price);

    if (doesExistBound) {
      needValuesForKeys.push({
        price,
        quantity,
        isAsk: true,
      });
    }

    return [price, quantity, true];
  });

  bids = bids.map(bid => {
    let [price, quantity] = bid;

    price = parseFloat(price);
    quantity = parseFloat(quantity);

    const doesExistBound = cacheInstrumentVolumeBoundsKeys.some(key => parseFloat(key) === price);

    if (doesExistBound) {
      needValuesForKeys.push({
        price,
        quantity,
        isAsk: false,
      });
    }

    return [price, quantity, false];
  });

  // check and remove if it needs
  if (needValuesForKeys.length) {
    let cacheInstrumentVolumeBounds = await redis.hmgetAsync(
      keyInstrumentVolumeBounds, needValuesForKeys.map(e => e.price),
    );

    if (!cacheInstrumentVolumeBounds) {
      cacheInstrumentVolumeBounds = [];
    }

    const boundsToRemove = [];
    const boundsToUpdate = [];

    needValuesForKeys.forEach(({
      price, quantity, isAsk,
    }, index) => {
      const boundInRedis = JSON.parse(cacheInstrumentVolumeBounds[index]);

      if (boundInRedis) {
        if (quantity < boundInRedis.min_quantity_for_cancel) {
          boundsToRemove.push({
            price,
            quantity,
            is_ask: isAsk,
            bound_id: boundInRedis.bound_id,
            min_quantity_for_cancel: boundInRedis.min_quantity_for_cancel,
          });
        } else if (quantity !== boundInRedis.quantity) {
          boundsToUpdate.push({
            price,
            quantity,
            is_ask: isAsk,
            bound_id: boundInRedis.bound_id,
            created_at: boundInRedis.created_at,
          });
        }
      }
    });

    if (boundsToRemove.length) {
      await Promise.all(boundsToRemove.map(async bound => {
        const resultUpdate = await updateInstrumentVolumeBound({
          boundId: bound.bound_id,
          endQuantity: bound.quantity,
          isActive: false,
        });

        if (!resultUpdate || !resultUpdate.status) {
          const message = resultUpdate.message || 'Cant updateInstrumentVolumeBound (is_active)';
          log.warn(message);
          return null;
        }

        sendData({
          actionName: 'deactivateInstrumentVolumeBound',
          data: {
            _id: bound.bound_id,
            price: bound.price,
            is_ask: bound.is_ask,
            quantity: bound.quantity,
            instrument_id: cacheInstrumentDoc._id,
          },
        });
      }));

      await redis.hdelAsync(keyInstrumentVolumeBounds, boundsToRemove.map(e => e.price));
    }

    if (boundsToUpdate.length) {
      await Promise.all(boundsToUpdate.map(async bound => {
        await redis.hmsetAsync(keyInstrumentVolumeBounds, bound.price, JSON.stringify({
          is_ask: bound.is_ask,
          bound_id: bound.bound_id,
          quantity: bound.quantity,
          created_at: bound.created_at,
          min_quantity_for_cancel: bound.min_quantity_for_cancel,
        }));

        sendData({
          actionName: 'updateInstrumentVolumeBound',
          data: {
            _id: bound.bound_id,
            price: bound.price,
            is_ask: bound.is_ask,
            quantity: bound.quantity,
            instrument_id: cacheInstrumentDoc._id,
          },
        });
      }));
    }
  }

  // create new bounds
  const boundsToAdd = [];

  [...asks, ...bids]
    .filter(([price]) => !cacheInstrumentVolumeBoundsKeys.some(key => parseFloat(key) === price))
    .forEach(([price, quantity, isAsk]) => {
      if (quantity >= halfOfAverageVolumeForLast24Hours) {
        const differenceBetweenPriceAndOrder = Math.abs(cacheInstrumentDoc.price - price);
        const percentPerPrice = 100 / (cacheInstrumentDoc.price / differenceBetweenPriceAndOrder);

        if (percentPerPrice <= LIMITER_RANGE_FOR_LIMIT_ORDERS) {
          boundsToAdd.push({
            is_ask: isAsk,
            price,
            quantity,
          });
        }
      }
    });

  if (boundsToAdd.length) {
    await Promise.all(boundsToAdd.map(async bound => {
      const resultCreate = await createInstrumentVolumeBound({
        instrumentId: cacheInstrumentDoc._id,
        isFutures: cacheInstrumentDoc.is_futures,

        price: parseFloat(bound.price),
        startQuantity: parseFloat(bound.quantity),
        averageVolumeForLast24Hours: cacheInstrumentDoc.average_volume_for_last_24_hours,
        averageVolumeForLast15Minutes: cacheInstrumentDoc.average_volume_for_last_15_minutes,
      });

      if (!resultCreate || !resultCreate.status) {
        const message = resultCreate.message || 'Cant createInstrumentVolumeBound';
        log.warn(message);
        return null;
      }

      const newBound = resultCreate.result;
      const createdAtUnix = moment(newBound.created_at).unix();

      await redis.hmsetAsync(keyInstrumentVolumeBounds, bound.price, JSON.stringify({
        bound_id: newBound._id,
        is_ask: newBound.is_ask,
        quantity: newBound.start_quantity,
        created_at: createdAtUnix,
      }));

      sendData({
        actionName: 'newInstrumentVolumeBound',
        data: {
          _id: newBound._id,
          price: bound.price,
          is_ask: bound.is_ask,
          quantity: bound.start_quantity,
          created_at: createdAtUnix,
          instrument_id: cacheInstrumentDoc._id,
        },
      });
    }));
  }

  return {
    status: true,
  };
};

module.exports = {
  checkInstrumentVolumeBounds,
};
