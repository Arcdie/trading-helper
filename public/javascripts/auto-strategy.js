/* global
  moment,
  Strategy,
  chartCandles, stocksData, stocksRSIData, trendLines
*/

// $.JQuery

// Functions

// Constants
const balance = 1000;
const strategy = new Strategy();

const lastBarsToIgnore = 2;
const startBarsToIgnore = 0;

let isActiveOrder = false;

const startAutoStrategy = () => {
  const newTrendLines = [];

  const lData = stocksData.length;
  for (let i = startBarsToIgnore; i < lData - lastBarsToIgnore; i += 1) {
    const candle = stocksData[i];
    const candleRSI = stocksRSIData[i];

    if (candleRSI.value <= 30
      && !isActiveOrder) {
      strategy.newBuy({
        stockPrice: candle.close,
        typeGame: 1,
      });

      chartCandles.addMarker({
        time: candle.time,
        color: '#4CAF50',
      });

      newTrendLines.push({
        candleIndex: i,
        value: strategy.stopLoss,

        options: {
          color: '#FF5252',
        },
      }, {
        candleIndex: i,
        value: strategy.takeProfit,

        options: {
          color: '#4CAF50',
        },
      });

      isActiveOrder = true;

      // because candle.close
      continue;
    }

    if (isActiveOrder) {
      const {
        typeGame,
        stopLoss,
        takeProfit,
      } = strategy;

      let result = 0;

      if (typeGame === 1) {
        if (candle.low <= stopLoss) {
          isActiveOrder = false;
          result = strategy.loseBuy(candle.low);
        } else if (candle.high >= takeProfit) {
          isActiveOrder = false;
          result = strategy.winBuy(candle.high);
        }
      } else {
        if (candle.high >= stopLoss) {
          isActiveOrder = false;
          result = strategy.loseBuy(candle.high);
        } else if (candle.low <= takeProfit) {
          isActiveOrder = false;
          result = strategy.winBuy(candle.low);
        }
      }

      if (!isActiveOrder) {
        chartCandles.addMarker({
          time: candle.time,
          color: '#FF5252',
          text: result.toFixed(2).toString(),
        });
      }
    }

    /*
    if (candleRSI.value >= 50
      && isActiveOrder) {
      const result = strategy.manualSell(candle.close);

      chartCandles.addMarker({
        time: candle.time,
        color: '#FF5252',
        text: result.toFixed(2).toString(),
      });

      isActiveOrder = false;
    }
    */
  }

  chartCandles.drawMarkers();
  strategy.getInfo();

  if (newTrendLines.length) {
    newTrendLines.forEach(data => {
      const candle = stocksData[data.candleIndex];
      const nextCandle = stocksData[data.candleIndex + 1];

      const newLine = {
        start: {
          value: data.value,
          time: candle.time,
        },

        end: {
          value: data.value,
          time: nextCandle.time,
        },

        options: {
          ...data.options,
          lineWidth: 1,
        }
      };

      trendLines.addSeries(newLine);
    });
  }
};
