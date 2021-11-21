const {
  isMongoId,
} = require('validator');

const log = require('../../../libs/logger');
const redis = require('../../../libs/redis');

const addLevelsToRedis = async ({
  userId,
  instrumentName,

  levels,
}) => {
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

  const keyInstrumentLevelBounds = `INSTRUMENT:${instrumentName}:LEVEL_BOUNDS`;
  let cacheInstrumentLevelBoundsKeys = await redis.hkeysAsync(keyInstrumentLevelBounds);

  if (!cacheInstrumentLevelBoundsKeys || !cacheInstrumentLevelBoundsKeys.length) {
    cacheInstrumentLevelBoundsKeys = [];
  }

  const fetchPromises = [];

  await Promise.all(levels.map(async ({
    boundId,
    isLong,
    levelPrice,
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
};

module.exports = {
  addLevelsToRedis,
};
