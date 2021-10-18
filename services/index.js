const binanceFuturesAPI = require('./binance-futures-api');
const binanceFuturesWebsocket = require('./binance-futures-websocket');
const binanceFuturesAggregation = require('./binance-futures-aggregation');

const updatePricesForInstruments = require('./update-prices-for-instruments');

module.exports = () => {
  if (process.env.NODE_ENV !== 'localhost') {
    // binanceFuturesAPI();

    binanceFuturesWebsocket();
    binanceFuturesAggregation();
  }

  // updatePricesForInstruments();
};
