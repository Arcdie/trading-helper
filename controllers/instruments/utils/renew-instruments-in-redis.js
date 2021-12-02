const redis = require('../../../libs/redis');

const InstrumentNew = require('../../../models/InstrumentNew');

const renewInstrumentsInRedis = async (instrumentsIds = []) => {
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
};

module.exports = {
  renewInstrumentsInRedis,
};
