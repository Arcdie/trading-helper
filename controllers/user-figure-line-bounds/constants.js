const {
  INTERVALS,
} = require('../candles/constants');

const INTERVALS_SETTINGS = {
  [INTERVALS.get('5m')]: {
    PADDING: 20,
    NUMBER_TOUCHES: 0,
    ALLOWED_PERCENT: 0.2,
    SUBTRACT_TIME: 7 * 24 * 60 * 60, // 7 days
  },

  [INTERVALS.get('1h')]: {
    PADDING: 20,
    NUMBER_TOUCHES: 0,
    ALLOWED_PERCENT: 0.2,
    SUBTRACT_TIME: 3 * 31 * 24 * 60 * 60, // 3 months
  },
};

module.exports = {
  INTERVALS_SETTINGS,
};
