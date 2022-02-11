const log = require('../../../libs/logger')(module);

const getShortFigureLines = (candles, settings) => {
  try {
    if (!candles || !candles.length) {
      return [];
    }

    const figureLines = [];
    const lCandles = candles.length;

    const highestCandles = [];

    for (let i = 0; i < lCandles - settings.PADDING; i += 1) {
      const candle = candles[i];
      const startIndex = i - settings.PADDING;

      const targetCandlesArr = candles.slice(
        startIndex < 0 ? 0 : startIndex,
        i + settings.PADDING,
      );

      let isCandleHighHighest = true;

      targetCandlesArr.forEach(tCandle => {
        if (!isCandleHighHighest) {
          return true;
        }

        if (tCandle.high > candle.high) {
          isCandleHighHighest = false;
        }
      });

      if (isCandleHighHighest) {
        highestCandles.push(candle);
      }
    }

    for (let i = 0; i < highestCandles.length; i += 1) {
      const candle = highestCandles[i];

      if (!highestCandles[i + 1]) {
        break;
      }

      const indexOfFirstCandle = candles.findIndex(
        tCandle => tCandle.originalTimeUnix === candle.originalTimeUnix,
      );

      for (let j = i + 1; j < highestCandles.length; j += 1) {
        const nextCandle = highestCandles[j];

        const indexOfSecondCandle = candles.findIndex(
          tCandle => tCandle.originalTimeUnix === nextCandle.originalTimeUnix,
        );

        const numberCandles = indexOfSecondCandle - indexOfFirstCandle;

        if (candle.high < nextCandle.high || numberCandles < 2) {
          continue;
        }

        const differenceBetweenHighs = candle.high - nextCandle.high;
        const numberReduceForPrice = differenceBetweenHighs / numberCandles;

        let isExit = false;
        let currentPrice = candle.high;

        for (let j = indexOfFirstCandle + 1; j < lCandles; j += 1) {
          currentPrice -= numberReduceForPrice;

          const price = candles[j].isLong ? candles[j].close : candles[j].open;
          const limitPrice = currentPrice + (currentPrice * (settings.ALLOWED_PERCENT / 100));
          const limitPriceForHigh = currentPrice + (currentPrice * ((settings.ALLOWED_PERCENT * 2) / 100));

          if (price > limitPrice || candles[j].high > limitPriceForHigh) {
            isExit = true;
            break;
          }
        }

        if (isExit) {
          continue;
        }

        figureLines.push({
          isLong: false,
          priceAngle: numberReduceForPrice,
          lineStartCandleExtremum: candle.high,
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
  getShortFigureLines,
};
