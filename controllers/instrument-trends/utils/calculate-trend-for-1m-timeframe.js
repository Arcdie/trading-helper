const {
  isEmpty,
} = require('lodash');

const {
  isMongoId,
} = require('validator');

const log = require('../../../libs/logger');

const {
  calculateSuperTrend,
} = require('./calculate-supertrend');

const {
  updateInstrumentTrend,
} = require('./update-instrument-trend');

const {
  FACTOR_FOR_MICRO_TREND,
  FACTOR_FOR_MACRO_TREND,
  ATR_PERIOD_FOR_MICRO_TREND,
  ATR_PERIOD_FOR_MACRO_TREND,
} = require('../constants');

const Candle1m = require('../../../models/Candle-1m');
const InstrumentTrend = require('../../../models/InstrumentTrend');

const calculateTrendFor1mTimeframe = async ({
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

  const instrumentTrendDoc = await InstrumentTrend.findOne({
    instrument_id: instrumentId,
  }, {
    micro_trend_for_1m_timeframe: 1,
    macro_trend_for_1m_timeframe: 1,
  }).exec();

  if (!instrumentTrendDoc) {
    return {
      status: false,
      message: 'No InstrumentTrend',
    };
  }

  const candlesDocs = await Candle1m
    .find({ instrument_id: instrumentId }, { data: 1 })
    .sort({ time: -1 })
    .limit(ATR_PERIOD_FOR_MACRO_TREND * 2)
    .exec();

  if (!candlesDocs || !candlesDocs.length) {
    return { status: true };
  }

  const preparedDataForCalculation = candlesDocs.map(doc => ({
    close: doc.data[1],
    low: doc.data[2],
    high: doc.data[3],
  }));

  const microTrendData = calculateSuperTrend({
    data: preparedDataForCalculation,
    factor: FACTOR_FOR_MICRO_TREND,
    atrPeriod: ATR_PERIOD_FOR_MICRO_TREND,
  });

  const macroTrendData = calculateSuperTrend({
    data: preparedDataForCalculation,
    factor: FACTOR_FOR_MACRO_TREND,
    atrPeriod: ATR_PERIOD_FOR_MACRO_TREND,
  });

  const funcObj = {};

  const lastElemMicroTrendData = microTrendData[microTrendData.length - 1];
  const lastElemMacroTrendData = macroTrendData[macroTrendData.length - 1];

  console.log('lastElemMacroTrendData', lastElemMacroTrendData);

  if (lastElemMicroTrendData) {
    const direction = lastElemMicroTrendData.isLong ? 'long' : 'short';

    if (direction !== instrumentTrendDoc.micro_trend_for_1m_timeframe) {
      funcObj.microTrendFor1mTimeframe = direction;
    }
  }

  if (lastElemMacroTrendData) {
    const direction = lastElemMacroTrendData.isLong ? 'long' : 'short';

    if (direction !== instrumentTrendDoc.macro_trend_for_1m_timeframe) {
      funcObj.macroTrendFor1mTimeframe = direction;
    }
  }

  if (!isEmpty(funcObj)) {
    funcObj.instrumentId = instrumentId;
    funcObj.instrumentName = instrumentName;

    const resultUpdateInstrumentTrend = await updateInstrumentTrend(funcObj);

    if (!resultUpdateInstrumentTrend || !resultUpdateInstrumentTrend.status) {
      log.warn(resultUpdateInstrumentTrend.message || 'Cant updateInstrumentTrend');
    }
  }

  return {
    status: true,
  };
};

module.exports = {
  calculateTrendFor1mTimeframe,
};
