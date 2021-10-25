const moment = require('moment');

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
  generateMongoId,
} = require('../../../libs/support');

const {
  createInstrumentVolumeBound,
} = require('./create-instrument-volume-bound');

const {
  updateInstrumentVolumeBound,
} = require('./update-instrument-volume-bound');

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
    log.warn(`No cacheInstrumentDoc doc; instrumentName: ${instrumentName}`);
    return null;
  }

  cacheInstrumentDoc = JSON.parse(cacheInstrumentDoc);

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
        if (quantity < cacheInstrumentDoc.average_volume_for_last_15_minutes * 2) {
          boundsToRemove.push({
            price,
            quantity,
            isAsk,
            boundId: boundInRedis.bound_id,
          });
        } else if (quantity !== boundInRedis.quantity) {
          boundsToUpdate.push({
            price,
            quantity,
            isAsk,
            boundId: boundInRedis.bound_id,
            createdAt: boundInRedis.created_at,
          });
        }
      }
    });

    if (boundsToRemove.length) {
      /*
      await Promise.all(boundsToRemove.map(async bound => {
        const resultUpdate = await updateInstrumentVolumeBound({
          boundId: bound.boundId,
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
            _id: bound.boundId,
            is_ask: bound.isAsk,
            price: bound.price,
            quantity: bound.quantity,
            instrument_id: cacheInstrumentDoc._id,
          },
        });
      }));
      */

      boundsToRemove.forEach(bound => {
        sendData({
          actionName: 'deactivateInstrumentVolumeBound',
          data: {
            _id: bound.boundId,
            price: bound.price,
            is_ask: bound.isAsk,
            quantity: bound.quantity,
            instrument_id: cacheInstrumentDoc._id,
          },
        });
      });

      await redis.hdelAsync(keyInstrumentVolumeBounds, boundsToRemove.map(e => e.price));
    }

    if (boundsToUpdate.length) {
      await Promise.all(boundsToUpdate.map(async bound => {
        /*
        const resultUpdate = await updateInstrumentVolumeBound({
          boundId: bound.boundId,
          quantity: bound.quantity,
          averageVolumeForLast15Minutes: cacheInstrumentDoc.average_volume_for_last_15_minutes,
        });

        if (!resultUpdate || !resultUpdate.status) {
          const message = resultUpdate.message || 'Cant updateInstrumentVolumeBound (quantity)';
          log.warn(message);
          return null;
        }
        */

        await redis.hmsetAsync(keyInstrumentVolumeBounds, bound.price, JSON.stringify({
          is_ask: bound.isAsk,
          bound_id: bound.boundId,
          quantity: bound.quantity,
          created_at: bound.createdAt,
          // average_volume_for_last_15_minutes: cacheInstrumentDoc.average_volume_for_last_15_minutes,
        }));

        sendData({
          actionName: 'updateInstrumentVolumeBound',
          data: {
            _id: bound.boundId,
            price: bound.price,
            is_ask: bound.isAsk,
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
      if (quantity > cacheInstrumentDoc.average_volume_for_last_15_minutes * 2) {
        const differenceBetweenPriceAndOrder = Math.abs(cacheInstrumentDoc.price - price);
        const percentPerPrice = 100 / (cacheInstrumentDoc.price / differenceBetweenPriceAndOrder);

        if (percentPerPrice <= LIMITER_RANGE_FOR_LIMIT_ORDERS) {
          boundsToAdd.push({
            isAsk,
            price,
            quantity,
          });
        }
      }
    });

  if (boundsToAdd.length) {
    const createdAt = moment().unix();

    await Promise.all(boundsToAdd.map(async bound => {
      /*
      const resultCreate = await createInstrumentVolumeBound({
        instrumentId: cacheInstrumentDoc._id,
        price: bound.price,
        quantity: bound.quantity,
        averageVolumeForLast15Minutes: cacheInstrumentDoc.average_volume_for_last_15_minutes,
        isAsk: bound.isAsk,
      });

      if (!resultCreate || !resultCreate.status) {
        const message = resultCreate.message || 'Cant createInstrumentVolumeBound';
        log.warn(message);
        return null;
      }

      const newBound = resultCreate.result;
      */

      const boundId = generateMongoId();

      await redis.hmsetAsync(keyInstrumentVolumeBounds, bound.price, JSON.stringify({
        // bound_id: newBound._id,
        bound_id: boundId,
        is_ask: bound.isAsk,
        quantity: bound.quantity,
        created_at: createdAt,
        // average_volume_for_last_15_minutes: cacheInstrumentDoc.average_volume_for_last_15_minutes,
      }));

      sendData({
        // data: newBound,
        actionName: 'newInstrumentVolumeBound',
        data: {
          _id: boundId,
          price: bound.price,
          is_ask: bound.isAsk,
          quantity: bound.quantity,
          created_at: createdAt,
          instrument_id: cacheInstrumentDoc._id,
          average_volume_for_last_15_minutes: cacheInstrumentDoc.average_volume_for_last_15_minutes,
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
