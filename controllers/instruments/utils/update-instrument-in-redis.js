const redis = require('../../../libs/redis');
const log = require('../../../libs/logger')(module);

const InstrumentNew = require('../../../models/InstrumentNew');

const updateInstrumentInRedis = async ({
  instrumentName,

  price,
  averageVolumeForLast24Hours,
  averageVolumeForLast15Minutes,
}) => {
  try {
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

    if (averageVolumeForLast24Hours) {
      cacheDoc.average_volume_for_last_24_hours = averageVolumeForLast24Hours;
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
  } catch (error) {
    log.warn(error.message);

    return {
      status: false,
      message: error.message,
    };
  }
};

module.exports = {
  updateInstrumentInRedis,
};
