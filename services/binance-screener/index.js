const get1mCandlesForSpotInstruments = require('./spot/get-1m-candles-for-spot-instruments');
const get5mCandlesForSpotInstruments = require('./spot/get-5m-candles-for-spot-instruments');
const get1hCandlesForSpotInstruments = require('./spot/get-1h-candles-for-spot-instruments');

const get1mCandlesForFuturesInstruments = require('./futures/get-1m-candles-for-futures-instruments');
const get5mCandlesForFuturesInstruments = require('./futures/get-5m-candles-for-futures-instruments');
const get1hCandlesForFuturesInstruments = require('./futures/get-1h-candles-for-futures-instruments');

module.exports = async () => {
  await get1mCandlesForSpotInstruments();
  await get5mCandlesForSpotInstruments();
  await get1hCandlesForSpotInstruments();

  await get1mCandlesForFuturesInstruments();
  await get5mCandlesForFuturesInstruments();
  await get1hCandlesForFuturesInstruments();
};
