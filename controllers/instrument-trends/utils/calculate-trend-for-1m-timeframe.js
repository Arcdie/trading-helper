const {
  isEmpty,
  cloneDeep,
} = require('lodash');

const {
  isMongoId,
} = require('validator');

const log = require('../../../libs/logger')(module);

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

const calculateTrendFor1mTimeframe = async ({
  instrumentId,
  instrumentName,
}) => {
  try {
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
      interval: INTERVALS.get('1m'),
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

    if (!candlesDocs || !candlesDocs.length) {
      return { status: true };
    }

    const preparedDataForCalculation = candlesDocs
      .reverse()
      .map(doc => ({
        close: doc.data[1],
        low: doc.data[2],
        high: doc.data[3],
      }));

    const microTrendData = calculateSuperTrend({
      data: cloneDeep(preparedDataForCalculation),
      factor: FACTOR_FOR_MICRO_TREND,
      atrPeriod: ATR_PERIOD_FOR_MICRO_TREND,
    });

    const macroTrendData = calculateSuperTrend({
      data: cloneDeep(preparedDataForCalculation),
      factor: FACTOR_FOR_MACRO_TREND,
      atrPeriod: ATR_PERIOD_FOR_MACRO_TREND,
    });

    const funcObj = {};

    const lastElemMicroTrendData = microTrendData[microTrendData.length - 1];
    const lastElemMacroTrendData = macroTrendData[macroTrendData.length - 1];

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
  } catch (error) {
    log.warn(error.message);

    return {
      status: false,
      message: error.message,
    };
  }
};

module.exports = {
  calculateTrendFor1mTimeframe,
};
