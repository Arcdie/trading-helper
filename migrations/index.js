// const loadDailyKlines = require('./load-daily-klines');

const removeCandlesForPeriod = require('./remove-candles-for-period');
const loadAndSaveKlinesHistory = require('./load-and-save-klines-history');
const loadAndSaveFuturesKlinesHistory = require('./load-and-save-futures-klines-history');
const calculateElderCandlesForInstruments = require('./calculate-elder-candles-for-instruments');

// aggTrades
const saveAggTrades = require('./save-aggTrades');
const loadAggTradesHistory = require('./load-aggTrades-history');

module.exports = () => {
  // loadDailyKlines();

  // removeCandlesForPeriod();
  // loadAndSaveFuturesKlinesHistory();
  // calculateElderCandlesForInstruments();

  // addExchangeInfoAndTickSize();

  // kline
  // loadAndSaveKlinesHistory();

  // aggTrades
  // loadAggTradesHistory();
  // saveAggTrades();
};
