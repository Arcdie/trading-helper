const log = require('../../../libs/logger')(module);

const getHighLevels = ({
  candles, distanceInBars,
}) => {
  try {
    const levels = [];
    const lCandles = candles.length;
    const revercedCandles = [...candles].reverse();

    candles.forEach((candle, index) => {
      if (index < distanceInBars) {
        return true;
      }

      let isHighest = true;
      let isHighCrossed = false;

      for (let i = (lCandles - index); i < lCandles; i += 1) {
        const tmpCandle = revercedCandles[i];

        if (tmpCandle.high > candle.high) {
          isHighCrossed = true;
          break;
        }
      }

      if (!isHighCrossed) {
        for (let i = 0; i < distanceInBars; i += 1) {
          const tmpCandle = revercedCandles[lCandles - index - i];

          if (!tmpCandle) {
            break;
          }

          if (tmpCandle.high > candle.high) {
            isHighest = false;
            break;
          }
        }
      }

      if (!isHighCrossed && isHighest) {
        levels.push({
          levelPrice: candle.high,
          levelStartCandleTime: candle.time,
        });
      }
    });

    return levels;
  } catch (error) {
    log.warn(error.message);
    return [];
  }
};

module.exports = {
  getHighLevels,
};
