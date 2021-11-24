const {
  isEmpty,
} = require('lodash');

const {
  isMongoId,
} = require('validator');

const redis = require('../../../libs/redis');

const InstrumentTrend = require('../../../models/InstrumentTrend');

const updateInstrumentTrend = async ({
  instrumentId,
  instrumentName,

  microTrendFor1mTimeframe,
  microTrendFor5mTimeframe,
  microTrendFor1hTimeframe,
  microTrendFor4hTimeframe,
  microTrendFor1dTimeframe,

  macroTrendFor1mTimeframe,
  macroTrendFor5mTimeframe,
  macroTrendFor1hTimeframe,
  macroTrendFor4hTimeframe,
  macroTrendFor1dTimeframe,
}) => {
  if (!instrumentId || !isMongoId(instrumentId.toString())) {
    return {
      status: false,
      message: 'No or invalid instrumentId',
    };
  }

  if (!instrumentName) {
    return {
      status: false,
      message: 'No instrumentName',
    };
  }

  const updateObj = {};

  // micro
  if (microTrendFor1mTimeframe) {
    updateObj.micro_trend_for_1m_timeframe = microTrendFor1mTimeframe;
  }

  if (microTrendFor5mTimeframe) {
    updateObj.micro_trend_for_5m_timeframe = microTrendFor5mTimeframe;
  }

  if (microTrendFor1hTimeframe) {
    updateObj.micro_trend_for_1h_timeframe = microTrendFor1hTimeframe;
  }

  if (microTrendFor4hTimeframe) {
    updateObj.micro_trend_for_4h_timeframe = microTrendFor4hTimeframe;
  }

  if (microTrendFor1dTimeframe) {
    updateObj.micro_trend_for_1d_timeframe = microTrendFor1dTimeframe;
  }

  // macro
  if (macroTrendFor1mTimeframe) {
    updateObj.macro_trend_for_1m_timeframe = macroTrendFor1mTimeframe;
  }

  if (macroTrendFor5mTimeframe) {
    updateObj.macro_trend_for_5m_timeframe = macroTrendFor5mTimeframe;
  }

  if (macroTrendFor1hTimeframe) {
    updateObj.macro_trend_for_1h_timeframe = macroTrendFor1hTimeframe;
  }

  if (macroTrendFor4hTimeframe) {
    updateObj.macro_trend_for_4h_timeframe = macroTrendFor4hTimeframe;
  }

  if (macroTrendFor1dTimeframe) {
    updateObj.macro_trend_for_1d_timeframe = macroTrendFor1dTimeframe;
  }

  if (!isEmpty(updateObj)) {
    const instrumentTrendDoc = await InstrumentTrend.findOneAndUpdate({
      instrument_id: instrumentId,
    }, updateObj).exec();

    const key = `INSTRUMENT:${instrumentName}:TREND`;

    await redis.setAsync([
      key,
      JSON.stringify(instrumentTrendDoc._doc),
    ]);
  }

  return {
    status: true,
  };
};

module.exports = {
  updateInstrumentTrend,
};
