const getLowLevels = async ({
  candles, distanceInBars,
}) => {
  const levels = [];
  const lCandles = candles.length;
  const revercedCandles = [...candles].reverse();

  for (let index = 0; index < lCandles - distanceInBars; index += 1) {
    const candle = revercedCandles[index];

    let isLowest = true;
    let isLowCrossed = false;

    for (let j = index; j < revercedCandles.length; j += 1) {
      const tmpCandle = revercedCandles[j];
      if (tmpCandle.low < candle.low) {
        isLowCrossed = true;
        break;
      }
    }

    if (!isLowCrossed) {
      for (let j = 0; j < distanceInBars; j += 1) {
        const tmpCandle = revercedCandles[index - j];

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
  }

  return levels;
};

module.exports = {
  getLowLevels,
};
