const log = require('../../../libs/logger')(module);

const getLongFigureLines = (candles, settings) => {
  try {
    if (!candles || !candles.length) {
      return [];
    }

    const figureLines = [];
    const lCandles = candles.length;

    const lowestCandles = [];

    for (let i = 0; i < lCandles - settings.PADDING; i += 1) {
      const candle = candles[i];
      const startIndex = i - settings.PADDING;

      const targetCandlesArr = candles.slice(
        startIndex < 0 ? 0 : startIndex,
        i + settings.PADDING,
      );

      let isCandleLowLowest = true;

      targetCandlesArr.forEach(tCandle => {
        if (!isCandleLowLowest) {
          return true;
        }

        if (tCandle.low < candle.low) {
          isCandleLowLowest = false;
        }
      });

      if (isCandleLowLowest) {
        lowestCandles.push(candle);
      }
    }

    for (let i = 0; i < lowestCandles.length; i += 1) {
      const candle = lowestCandles[i];

      if (!lowestCandles[i + 1]) {
        break;
      }

      const indexOfFirstCandle = candles.findIndex(
        tCandle => tCandle.originalTimeUnix === candle.originalTimeUnix,
      );

      for (let j = i + 1; j < lowestCandles.length; j += 1) {
        const nextCandle = lowestCandles[j];

        const indexOfSecondCandle = candles.findIndex(
          tCandle => tCandle.originalTimeUnix === nextCandle.originalTimeUnix,
        );

        const numberCandles = indexOfSecondCandle - indexOfFirstCandle;

        if (candle.low > nextCandle.low || numberCandles < 2) {
          continue;
        }

        const differenceBetweenLows = nextCandle.low - candle.low;
        const numberReduceForPrice = differenceBetweenLows / numberCandles;

        let isExit = false;
        let currentPrice = candle.low;

        for (let j = indexOfFirstCandle + 1; j < lCandles; j += 1) {
          currentPrice += numberReduceForPrice;

          const price = candles[j].isLong ? candles[j].open : candles[j].close;
          const limitPrice = currentPrice - (currentPrice * (settings.ALLOWED_PERCENT / 100));
          const limitPriceForHigh = currentPrice - (currentPrice * ((settings.ALLOWED_PERCENT * 2) / 100));

          if (price < limitPrice || candles[j].low < limitPriceForHigh) {
            isExit = true;
            break;
          }
        }

        if (isExit) {
          continue;
        }

        figureLines.push({
          isLong: true,
          priceAngle: numberReduceForPrice,
          lineStartCandleExtremum: candle.low,
          lineStartCandleTimeUnix: candle.originalTimeUnix,
        });
      }
    }

    return figureLines;
  } catch (error) {
    log.warn(error.message);
    return [];
  }
};

module.exports = {
  getLongFigureLines,
};
