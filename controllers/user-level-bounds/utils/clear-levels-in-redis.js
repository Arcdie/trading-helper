const redis = require('../../../libs/redis');

const clearLevelsInRedis = async () => {
  const key = 'INSTRUMENT:*:LEVEL_BOUNDS';
  const targetKeys = await redis.keysAsync(key);

  await Promise.all(targetKeys.map(async targetKey => {
    await redis.delAsync(targetKey);
  }));

  return {
    status: true,
  };
};

module.exports = {
  clearLevelsInRedis,
};
