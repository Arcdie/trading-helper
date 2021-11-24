const {
  isMongoId,
} = require('validator');

const redis = require('../../../libs/redis');

const InstrumentTrend = require('../../../models/InstrumentTrend');

const getInstrumentTrend = async ({
  instrumentId,
  instrumentName,
}) => {
  if (!instrumentName) {
    return {
      status: false,
      message: 'No instrumentName',
    };
  }

  if (!instrumentId || !isMongoId(instrumentId.toString())) {
    return {
      status: false,
      message: 'No or invalid instrumentId',
    };
  }

  const keyInstrumentTrend = `INSTRUMENT:${instrumentName}:TREND`;
  const instrumentTrend = await redis.getAsync(keyInstrumentTrend);

  if (instrumentTrend) {
    return {
      status: true,
      result: JSON.parse(instrumentTrend),
    };
  }

  const instrumentTrendDoc = await InstrumentTrend.findOne({
    instrument_id: instrumentId,
  }).exec();

  if (!instrumentTrendDoc) {
    return {
      status: false,
      message: 'No InstrumentTrend',
    };
  }

  await redis.setAsync([
    keyInstrumentTrend,
    JSON.stringify(instrumentTrendDoc._doc),
  ]);

  return {
    status: true,
    result: instrumentTrendDoc._doc,
  };
};

module.exports = {
  getInstrumentTrend,
};
