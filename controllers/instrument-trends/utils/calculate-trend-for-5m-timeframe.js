const {
  isEmpty,
} = require('lodash');

const {
  isMongoId,
} = require('validator');

const log = require('../../../libs/logger');

const {
  getInstrumentTrend,
} = require('./get-instrument-trend');

const {
  calculateSuperTrend,
} = require('./calculate-supertrend');

const {
  updateInstrumentTrend,
} = require('./update-instrument-trend');

const {
  getCandlesFromRedis,
} = require('../../candles/utils/get-candles-from-redis');

const {
  FACTOR_FOR_MICRO_TREND,
  FACTOR_FOR_MACRO_TREND,
  ATR_PERIOD_FOR_MICRO_TREND,
  ATR_PERIOD_FOR_MACRO_TREND,
} = require('../constants');

const {
  INTERVALS,
} = require('../../candles/constants');

const calculateTrendFor5mTimeframe = async ({
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

  const resultGetTrend = await getInstrumentTrend({
    instrumentId,
    instrumentName,
  });

  if (!resultGetTrend || !resultGetTrend.status) {
    const message = resultGetTrend.message || 'Cant getInstrumentTrend';
    log.warn(message);

    return {
      status: false,
      message,
    };
  }

  const instrumentTrendDoc = resultGetTrend.result;

  const resultGetCandles = await getCandlesFromRedis({
    instrumentId,
    instrumentName,
    interval: INTERVALS.get('5m'),
  });

  if (!resultGetCandles || !resultGetCandles.status) {
    const message = resultGetCandles.message || 'Cant getCandlesFromRedis';
    log.warn(message);

    return {
      status: false,
      message,
    };
  }

  const candlesDocs = resultGetCandles.result;
  const numberRequiredCandles = ATR_PERIOD_FOR_MACRO_TREND * 2;

  if (!candlesDocs || candlesDocs.length < numberRequiredCandles) {
    return { status: true };
  }

  const targetCandlesDocs = candlesDocs.slice(0, numberRequiredCandles + 1);

  const preparedDataForCalculation = targetCandlesDocs
    .reverse()
    .map(doc => ({
      close: doc.data[1],
      low: doc.data[2],
      high: doc.data[3],
    }));

  const microTrendData = calculateSuperTrend({
    data: preparedDataForCalculation.map(data => ({ ...data })),
    factor: FACTOR_FOR_MICRO_TREND,
    atrPeriod: ATR_PERIOD_FOR_MICRO_TREND,
  });

  const macroTrendData = calculateSuperTrend({
    data: preparedDataForCalculation.map(data => ({ ...data })),
    factor: FACTOR_FOR_MACRO_TREND,
    atrPeriod: ATR_PERIOD_FOR_MACRO_TREND,
  });

  const funcObj = {};

  const lastElemMicroTrendData = microTrendData[microTrendData.length - 1];
  const lastElemMacroTrendData = macroTrendData[macroTrendData.length - 1];

  if (lastElemMicroTrendData) {
    const direction = lastElemMicroTrendData.isLong ? 'long' : 'short';

    if (direction !== instrumentTrendDoc.micro_trend_for_5m_timeframe) {
      funcObj.microTrendFor5mTimeframe = direction;
    }
  }

  if (lastElemMacroTrendData) {
    const direction = lastElemMacroTrendData.isLong ? 'long' : 'short';

    if (direction !== instrumentTrendDoc.macro_trend_for_5m_timeframe) {
      funcObj.macroTrendFor5mTimeframe = direction;
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
  calculateTrendFor5mTimeframe,
};
