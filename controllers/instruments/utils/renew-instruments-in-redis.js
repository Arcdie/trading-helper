const redis = require('../../../libs/redis');

const InstrumentNew = require('../../../models/InstrumentNew');

const renewInstrumentsInRedis = async () => {
  const instrumentsDocs = await InstrumentNew.find({
    is_active: true,
  }).exec();

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
