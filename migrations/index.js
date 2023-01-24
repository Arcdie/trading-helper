const updateCandles = require('./update-candles');
const updateInstruments = require('./update-instruments');

// const loadDailyKlines = require('./load-daily-klines');

const renewFigureLinesInRedis = require('./renew-figure-lines-in-redis');
const removeCandlesForPeriod = require('./remove-candles-for-period');
const loadAndSaveKlinesHistory = require('./load-and-save-klines-history');
const loadAndSaveFuturesKlinesHistory = require('./load-and-save-futures-klines-history');
const calculateElderCandlesForInstruments = require('./calculate-elder-candles-for-instruments');


// aggTrades
const saveAggTrades = require('./save-aggTrades');
const loadAggTradesHistory = require('./load-aggTrades-history');
const loadWeeklyAggTradesHistory = require('./load-weekly-aggTrades-history');

const changeDoesIgnoreVolume = require('./change-does-ignore-volume');
const createInstrumentsTrends = require('./create-instrument-trends');
const removeCandlesDublicates = require('./remove-candles-dublicates');

const loadingMissingCandles = require('./loading-missing-candles');
const disableInstruments = require('./disable-instruments');

module.exports = () => {
  // updateCandles();
  // updateInstruments();
  // removeCandlesDublicates();
  // removeCandlesForPeriod();
  // calculateElderCandlesForInstruments();

  // changeDoesIgnoreVolume();
  // createInstrumentsTrends();
  // loadDailyKlines();

  // loadAndSaveFuturesKlinesHistory();

  // kline
  // loadAndSaveKlinesHistory();

  // aggTrades
  // loadAggTradesHistory();
  // saveAggTrades();
  // loadWeeklyAggTradesHistory();

  // renewFigureLinesInRedis();
  // loadingMissingCandles();
  // disableInstruments();
};
