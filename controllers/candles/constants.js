const LIFETIME_1M_CANDLES = 7 * 24 * 60 * 60; // 7 days, in seconds
const LIFETIME_5M_CANDLES = 30 * 24 * 60 * 60; // 1 month, in seconds

const LIMIT_CANDLES = 1000;

const INTERVALS = new Map([
  ['1m', '1m'],
  ['5m', '5m'],
  ['1h', '1h'],
  ['4h', '4h'],
  ['1d', '1d'],
]);

module.exports = {
  INTERVALS,
  LIMIT_CANDLES,

  LIFETIME_1M_CANDLES,
  LIFETIME_5M_CANDLES,
};
