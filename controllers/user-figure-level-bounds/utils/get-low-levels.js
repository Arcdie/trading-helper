const log = require('../../../libs/logger')(module);

const getLowLevels = ({
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

      let isLowest = true;
      let isLowCrossed = false;

      for (let i = index; i < lCandles; i += 1) {
        const tmpCandle = candles[i];

        if (tmpCandle.low < candle.low) {
          isLowCrossed = true;
          break;
        }
      }

      if (!isLowCrossed) {
        for (let i = 1; i < distanceFromLeftSide + 1; i += 1) {
          const tmpCandle = candles[index - i];

          if (!tmpCandle) {
            break;
          }

          if (tmpCandle.low < candle.low) {
            isLowest = false;
            break;
          }
        }
      }

      if (!isLowCrossed && isLowest) {
        levels.push({
          levelPrice: candle.low,
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
  getLowLevels,
};
