const {
  isMongoId,
} = require('validator');

const redis = require('../../../libs/redis');
const log = require('../../../libs/logger')(module);

const UserFigureLevelBound = require('../../../models/UserFigureLevelBound');

const checkUserFigureLevelBounds = async ({
  instrumentId,
  instrumentName,
  instrumentPrice,
}) => {
  try {
    if (!instrumentId || !isMongoId(instrumentId.toString())) {
      return {
        status: false,
        message: 'No or invalid instrumentId',
      };
    }

    if (!instrumentName) {
      return {
        status: false,
        message: 'No instrumentName',
      };
    }

    if (!instrumentPrice) {
      return {
        status: false,
        message: 'No instrumentPrice',
      };
    }

    const keyInstrumentLevelBounds = `INSTRUMENT:${instrumentName}:FIGURE_LEVEL_BOUNDS`;
    let cacheInstrumentLevelBoundsKeys = await redis.hkeysAsync(keyInstrumentLevelBounds);

    if (!cacheInstrumentLevelBoundsKeys) {
      cacheInstrumentLevelBoundsKeys = [];
    }

    const targetKeys = [];

    cacheInstrumentLevelBoundsKeys.forEach(key => {
      let [price, prefix] = key.split('_');
      const isLong = prefix === 'long';

      price = parseFloat(price);

      if (isLong
        && price < instrumentPrice) {
        targetKeys.push(key);
      } else if (!isLong
        && instrumentPrice < price) {
        targetKeys.push(key);
      }
    });

    if (!targetKeys.length) {
      return {
        status: true,
      };
    }

    const cacheInstrumentLevelBounds = await redis.hmgetAsync(
      keyInstrumentLevelBounds, targetKeys,
    );

    if (!cacheInstrumentLevelBounds || !cacheInstrumentLevelBounds.length) {
      return {
        status: true,
      };
    }

    const boundsIds = [];

    cacheInstrumentLevelBounds.forEach(bounds => {
      bounds = JSON.parse(bounds);

      bounds.forEach(bound => {
        boundsIds.push(bound.bound_id);
      });
    });

    await UserFigureLevelBound.updateMany({
      _id: {
        $in: boundsIds,
      },
    }, {
      is_worked: true,
      worked_at: new Date(),
    });

    await redis.hdelAsync(
      keyInstrumentLevelBounds,
      targetKeys,
    );

    return {
      status: true,
    };
  } catch (error) {
    log.warn(error.message);

    return {
      status: false,
      message: error.message,
    };
  }
};

module.exports = {
  checkUserFigureLevelBounds,
};
