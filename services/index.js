const binanceFuturesAPI = require('./binance-futures-api');
const binanceFuturesWebsocket = require('./binance-futures-websocket');

const updatePricesForInstruments = require('./update-prices-for-instruments');

module.exports = () => {
  if (process.env.NODE_ENV !== 'localhost') {
    // binanceFuturesAPI();
    binanceFuturesWebsocket();

    updatePricesForInstruments();
  }
};
