const redis = require('../../../libs/redis');

const clearSocketsInRedis = async () => {
  const key = 'USER:*:SOCKETS';
  const targetKeys = await redis.keysAsync(key);

  await Promise.all(targetKeys.map(async targetKey => {
    await redis.delAsync(targetKey);
  }));

  return {
    status: true,
  };
};

module.exports = {
  clearSocketsInRedis,
};
