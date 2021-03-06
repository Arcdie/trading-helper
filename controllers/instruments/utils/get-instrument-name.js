const {
  isMongoId,
} = require('validator');

const redis = require('../../../libs/redis');
const log = require('../../../libs/logger')(module);

const InstrumentNew = require('../../../models/InstrumentNew');

const getInstrumentName = async ({
  instrumentId,
}) => {
  try {
    if (!instrumentId || !isMongoId(instrumentId.toString())) {
      return {
        status: false,
        message: 'No or invalid instrumentId',
      };
    }

    const keyInstrumentName = `INSTRUMENT:${instrumentId}:NAME`;
    const instrumentName = await redis.getAsync(keyInstrumentName);

    if (instrumentName) {
      return {
        status: true,
        result: instrumentName,
      };
    }

    const instrumentDoc = await InstrumentNew.findById(instrumentId, {
      name: 1,
    }).exec();

    if (!instrumentDoc) {
      return {
        status: false,
        message: 'No Instrument',
      };
    }

    await redis.setAsync([`INSTRUMENT:${instrumentDoc._id.toString()}:NAME`, instrumentDoc.name]);

    return {
      status: true,
      result: instrumentDoc.name,
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
  getInstrumentName,
};
