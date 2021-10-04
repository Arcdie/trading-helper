const createBound = require('./create-bound');

const getUserLevelBounds = require('./get-user-level-bounds');

const getLevelsForOneInstrumentFromTradingView = require('./get-levels-for-one-instrument-from-tradingview');
const getLevelsForEveryInstrumentFromTradingView = require('./get-levels-for-every-instrument-from-tradingview');

const removeAllLevels = require('./remove-all-levels');
const removeLevelForInstrument = require('./remove-level-for-instrument');
const removeLevelsForInstrument = require('./remove-levels-for-instrument');

module.exports = {
  createBound,
  getUserLevelBounds,

  getLevelsForOneInstrumentFromTradingView,
  getLevelsForEveryInstrumentFromTradingView,

  removeAllLevels,
  removeLevelForInstrument,
  removeLevelsForInstrument,
};
