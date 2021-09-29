const binanceFuturesAPI = require('./binance-futures-api');
const binanceFuturesWebsocket = require('./binance-futures-websocket');

module.exports = () => {
  // binanceFuturesAPI();
  binanceFuturesWebsocket();
};
