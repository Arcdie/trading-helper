const TYPES_TRENDS = new Map([
  ['long', 'long'],
  ['short', 'short'],
  ['flat', 'flat'],
]);

const FACTOR_FOR_MICRO_TREND = 3;
const FACTOR_FOR_MACRO_TREND = 5;

const ATR_PERIOD_FOR_MICRO_TREND = 10;
const ATR_PERIOD_FOR_MACRO_TREND = 20;

module.exports = {
  TYPES_TRENDS,

  FACTOR_FOR_MICRO_TREND,
  FACTOR_FOR_MACRO_TREND,

  ATR_PERIOD_FOR_MICRO_TREND,
  ATR_PERIOD_FOR_MACRO_TREND,
};
