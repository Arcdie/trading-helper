const redis = require('../../../libs/redis');
const log = require('../../../libs/logger')(module);

const clearCandlesInRedis = async () => {
  try {
    const key = 'INSTRUMENT:*:CANDLES_*';
    const targetKeys = await redis.keysAsync(key);

    await Promise.all(targetKeys.map(async targetKey => {
      await redis.delAsync(targetKey);
    }));

    return {
      status: true,
    };
  } catch (error) {
    log.error(error.message);

    return {
      status: true,
      message: error.message,
    };
  }
};

module.exports = {
  clearCandlesInRedis,
};
