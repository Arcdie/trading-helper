const redis = require('../../../libs/redis');

const InstrumentNew = require('../../../models/InstrumentNew');

const updateInstrumentInRedis = async ({
  instrumentName,

  price,
  averageVolumeForLast15Minutes,
}) => {
  if (!instrumentName) {
    return {
      status: false,
      message: 'No instrumentName',
    };
  }

  const key = `INSTRUMENT:${instrumentName}`;
  let cacheDoc = await redis.getAsync(key);

  if (!cacheDoc) {
    const instrumentDoc = await InstrumentNew.findOne({
      name: instrumentName,
    }).exec();

    if (!instrumentDoc) {
      return {
        status: false,
        message: 'No Instrument',
      };
    }

    cacheDoc = instrumentDoc._doc;
  } else {
    cacheDoc = JSON.parse(cacheDoc);
  }

  if (price) {
    cacheDoc.price = parseFloat(price);
  }

  if (averageVolumeForLast15Minutes) {
    cacheDoc.average_volume_for_last_15_minutes = averageVolumeForLast15Minutes;
  }

  await redis.setAsync([
    key,
    JSON.stringify(cacheDoc),
  ]);

  return {
    status: true,
    result: cacheDoc,
  };
};

module.exports = {
  updateInstrumentInRedis,
};
