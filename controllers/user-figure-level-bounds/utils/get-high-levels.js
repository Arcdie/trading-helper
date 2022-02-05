const log = require('../../../libs/logger')(module);

const getHighLevels = ({
  candles,
  distanceFromLeftSide,
  distanceFromRightSide,
}) => {
  try {
    if (!candles || !candles.length) {
      return [];
    }

    const levels = [];
    const lCandles = candles.length;

    candles.forEach((candle, index) => {
      if ((lCandles - index) < distanceFromRightSide) {
        return true;
      }

      let isHighest = true;
      let isHighCrossed = false;

      for (let i = index; i < lCandles; i += 1) {
        const tmpCandle = candles[i];

        if (tmpCandle.high > candle.high) {
          isHighCrossed = true;
          break;
        }
      }

      if (!isHighCrossed) {
        for (let i = 1; i < distanceFromLeftSide + 1; i += 1) {
          const tmpCandle = candles[index - i];

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
          startOfLevelUnix: candle.originalTimeUnix,
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
