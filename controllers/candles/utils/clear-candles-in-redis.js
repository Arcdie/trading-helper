const redis = require('../../../libs/redis');

const clearCandlesInRedis = async () => {
  const key = 'INSTRUMENT:*:CANDLES_*';
  const targetKeys = await redis.keysAsync(key);

  await Promise.all(targetKeys.map(async targetKey => {
    await redis.delAsync(targetKey);
  }));

  return {
    status: true,
  };
};

module.exports = {
  clearCandlesInRedis,
};
