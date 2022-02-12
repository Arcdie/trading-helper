const {
  isMongoId,
} = require('validator');

const redis = require('../../../libs/redis');
const log = require('../../../libs/logger')(module);

const addFigureLevelsToRedis = async ({
  userId,
  instrumentName,

  levels,
}) => {
  try {
    if (!userId || !isMongoId(userId.toString())) {
      return {
        status: false,
        message: 'No or invalid userId',
      };
    }

    if (!levels || !levels.length) {
      return {
        status: false,
        message: 'No or empty levels',
      };
    }

    if (!instrumentName) {
      return {
        status: false,
        message: 'No instrumentName',
      };
    }

    const keyInstrumentLevelBounds = `INSTRUMENT:${instrumentName}:FIGURE_LEVEL_BOUNDS`;
    let cacheInstrumentLevelBoundsKeys = await redis.hkeysAsync(keyInstrumentLevelBounds);

    if (!cacheInstrumentLevelBoundsKeys || !cacheInstrumentLevelBoundsKeys.length) {
      cacheInstrumentLevelBoundsKeys = [];
    }

    const fetchPromises = [];

    await Promise.all(levels.map(async ({
      boundId,
      levelPrice,

      isLong,
      isModerated,
    }) => {
      const prefix = isLong ? 'long' : 'short';
      const instrumentLevelBoundKey = `${levelPrice}_${prefix}`;

      const existLevel = cacheInstrumentLevelBoundsKeys.find(
        key => key === instrumentLevelBoundKey,
      );

      let cacheInstrumentLevelBounds = [];

      if (existLevel) {
        cacheInstrumentLevelBounds = await redis.hmgetAsync(
          keyInstrumentLevelBounds, instrumentLevelBoundKey,
        );

        if (!cacheInstrumentLevelBounds || !cacheInstrumentLevelBounds.length) {
          cacheInstrumentLevelBounds = [];
        } else {
          cacheInstrumentLevelBounds = JSON.parse(cacheInstrumentLevelBounds);
        }
      } else {
        cacheInstrumentLevelBounds.push({
          user_id: userId,
          bound_id: boundId,
          is_moderated: isModerated,
        });
      }

      fetchPromises.push(
        redis.hmsetAsync(
          keyInstrumentLevelBounds,
          instrumentLevelBoundKey,
          JSON.stringify(cacheInstrumentLevelBounds),
        ),
      );
    }));

    await Promise.all(fetchPromises);

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
  addFigureLevelsToRedis,
};
