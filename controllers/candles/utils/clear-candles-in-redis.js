const redis = require('../../../libs/redis');
const log = require('../../../libs/logger')(module);

const clearCandlesInRedis = async ({
  timeframe,
  instrumentName,
}) => {
  try {
    const modifierTimeframe = timeframe || '*';
    const modifierInstrument = instrumentName || '*';

    const key = `INSTRUMENT:${modifierInstrument}:CANDLES_${modifierTimeframe}`;
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
