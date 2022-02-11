const redis = require('../../../libs/redis');
const log = require('../../../libs/logger')(module);

const clearFigureLinesFromRedis = async () => {
  try {
    const key = 'INSTRUMENT:*:FIGURE_LINE_BOUNDS';
    const targetKeys = await redis.keysAsync(key);

    await Promise.all(targetKeys.map(async targetKey => {
      await redis.delAsync(targetKey);
    }));

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
  clearFigureLinesFromRedis,
};
