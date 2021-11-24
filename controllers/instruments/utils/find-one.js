const {
  isMongoId,
} = require('validator');

const redis = require('../../../libs/redis');

const {
  getInstrumentName,
} = require('./get-instrument-name');

const InstrumentNew = require('../../../models/InstrumentNew');

const findOne = async ({
  instrumentId,
  instrumentName,
}) => {
  if (!instrumentId && !instrumentName) {
    return {
      status: false,
      message: 'No instrumentId and instrumentName',
    };
  }

  if (instrumentId && !isMongoId(instrumentId.toString())) {
    return {
      status: false,
      message: 'Invalid instrumentId',
    };
  }

  if (!instrumentName) {
    const resultGetName = await getInstrumentName({
      instrumentId,
    });

    if (!resultGetName || !resultGetName.status) {
      return {
        status: false,
        message: resultGetName.message || 'Cant getInstrumentName',
      };
    }

    instrumentName = resultGetName.result;
  }

  const keyInstrument = `INSTRUMENT:${instrumentName}`;
  const cacheDoc = await redis.getAsync(keyInstrument);

  if (cacheDoc) {
    return {
      status: true,
      result: JSON.parse(cacheDoc),
    };
  }

  const instrumentDoc = await InstrumentNew.findById(instrumentId).exec();

  if (!instrumentDoc) {
    return {
      status: false,
      message: 'No Instrument',
    };
  }

  if (!instrumentDoc.is_active) {
    return {
      status: false,
      message: 'Instrument is not active',
    };
  }

  await redis.setAsync([`INSTRUMENT:${instrumentDoc._id.toString()}`, JSON.stringify(instrumentDoc._doc)]);

  return {
    status: true,
    result: instrumentDoc._doc,
  };
};

module.exports = {
  findOne,
};
