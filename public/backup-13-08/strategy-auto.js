/* global moment, Strategy, chartCandles, stocksData, stocksRSIData, chartDraw, strategyConstants */

// $.JQuery

// Functions

// Constants
const strategy = new Strategy();

const lastBarsToIgnore = 5;
const startBarsToIgnore = 50;

// const lastBarsToIgnore = 0;
// const startBarsToIgnore = 0;

let typeGame = 0;

let doMustBuy = false;
let isActiveOrder = false;

// for rsi
const isWithTopCase = true;
const isWithBottomCase = true;

const startAutoStrategy = () => {
  const arrTPAndSL = [];

  const lData = stocksData.length;
  for (let i = startBarsToIgnore; i < lData - lastBarsToIgnore; i += 1) {
    const candle = stocksData[i];
    const candleRSI = stocksRSIData[i];

    if (!isActiveOrder) {
      // if (i === 1) {
      //   doMustBuy = true;
      //   typeGame = 1;
      // }

      if (isWithBottomCase) {
        if (candleRSI.value <= 35) {
          const prevCandle = stocksRSIData[i - 1];

          if (prevCandle.value < candleRSI.value) {
            doMustBuy = true;
            typeGame = 1;
          }
        }
      }

      if (isWithTopCase) {
        if (candleRSI.value >= 70) {
          const prevCandle = stocksRSIData[i - 1];

          if (prevCandle.value > candleRSI.value) {
            doMustBuy = true;
            typeGame = 2;
          }
        }
      }
    }

    if (!isActiveOrder && doMustBuy) {
      strategy.newBuy({
        stockPrice: candle.close,
        typeGame,
      });

      console.log('newBuyIndex', i);

      chartCandles.addMarker({
        time: candle.time,
        color: '#4CAF50',
      });

      arrTPAndSL.push({
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

      typeGame = 0;
      isActiveOrder = true;
      doMustBuy = false;

      // because candle.close
      continue;
    }

    if (isActiveOrder) {
      console.log('nextStep', i);

      const result = strategy.nextStep(candle);

      if (result.isFinish) {
        let text = result.result.toString();

        if (result.result > 0) {
          text += ` (1:${result.takeProfitCoefficient})`;
        }

        chartCandles.addMarker({
          time: candle.time,
          color: '#FF5252',
          text,
        });

        isActiveOrder = false;
      }

      if (result.isNewTakeProfit) {
        arrTPAndSL.push({
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

  if (arrTPAndSL.length) {
    arrTPAndSL.forEach(data => {
      const candle = stocksData[data.candleIndex];
      const nextCandle = stocksData[data.candleIndex + 1];

      const { options } = data;
      options.lineWidth = 1;

      const newLine = {
        start: {
          value: data.value,
          time: candle.time,
        },

        end: {
          value: data.value,
          time: nextCandle.time,
        },

        options,
      };

      chartDraw.addSeries(newLine);
    });
  }
};
