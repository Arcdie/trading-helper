const binanceFuturesDepth = require('./binance-futures-depth');
const binanceFuturesBookTicker = require('./binance-futures-book-ticker');
const binanceFuturesAggregation = require('./binance-futures-aggregation');

module.exports = () => {
  if (process.env.NODE_ENV !== 'localhost') {
    binanceFuturesDepth();
    binanceFuturesBookTicker();
    binanceFuturesAggregation();
  } else {
    // binanceFuturesDepth();
    // binanceFuturesAggregation();
  }
};
