const redis = require('../../../libs/redis');
const log = require('../../../libs/logger')(module);

const InstrumentNew = require('../../../models/InstrumentNew');

const renewInstrumentsInRedis = async (instrumentsIds = []) => {
  try {
    const findObj = {
      is_active: true,
    };

    if (instrumentsIds.length) {
      findObj._id = {
        $in: instrumentsIds,
      };
    }

    const instrumentsDocs = await InstrumentNew.find(findObj).exec();

    await Promise.all(instrumentsDocs.map(async doc => {
      const key = `INSTRUMENT:${doc.name}`;
      let cacheDoc = await redis.getAsync(key);

      cacheDoc = doc._doc;

      await redis.setAsync([
        key,
        JSON.stringify(cacheDoc),
      ]);
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
  renewInstrumentsInRedis,
};
