const FACTOR_FOR_PRICE_CHANGE = 3;
const NUMBER_CANDLES_FOR_CALCULATE_AVERAGE_PERCENT = 36; // 3 hours (5m)

const DOES_CONSIDER_BTC_MICRO_TREND = false;
const DOES_CONSIDER_FUTURES_MICRO_TREND = false;

const STOPLOSS_PERCENT = 0.5; // %

module.exports = {
  FACTOR_FOR_PRICE_CHANGE,
  NUMBER_CANDLES_FOR_CALCULATE_AVERAGE_PERCENT,

  DOES_CONSIDER_BTC_MICRO_TREND,
  DOES_CONSIDER_FUTURES_MICRO_TREND,

  STOPLOSS_PERCENT,
};
