/* global
  moment,
  ChartPeriods, chartDraw, Strategy
  chartPeriods, chartCandles, chartArea, chartSMA, chartRSI, chartADX,
  $strategy, $switch, $numberBuys, $balance, $winBuys, $loseBuys,
  strategyConstants, targetSeriesForUpdate, isActivePaintMode
*/

// $.JQuery
const $tradingActions = $('.trading-actions');
const $menu = $tradingActions.find('.menu');

const $percent = $menu.find('.percent span');
const $stopLoss = $menu.find('.stop-loss input');
const $numberStocks = $menu.find('.number-stocks input');

const $status = $tradingActions.find('.status');

const $buy = $tradingActions.find('.buy');
const $sell = $tradingActions.find('.sell');
const $confirm = $menu.find('.confirm');
const $actionButtons = $tradingActions.find('.choice button');

// constants
let isActivePosition = false;
let isHistoryModeActive = false;

const strategy = new Strategy();
const chartPeriodsForHistory = new ChartPeriods();

let typeGame = 1;
let stopLoss = 0;
let stocksToBuy = 0;

let tmpTP = false;
let tmpTP3 = false;
let tmpBreakeven = false;
let tmpSL = false;
let previousSLAndTP = [];

const {
  stopLossPercent,
  defaultTakeProfitCoefficient,
} = strategyConstants;

// Functions
const setPeriodForHistory = period => {
  const stocksData = chartPeriodsForHistory.setPeriod(period);

  chartCandles && chartCandles.drawSeries(stocksData);
  chartArea && chartArea.drawSeries(chartArea.calculateData(stocksData));
  chartSMA && chartSMA.drawSeries(chartSMA.calculateData(stocksData));
  chartADX && chartADX.drawSeries(chartADX.calculateData(stocksData));

  chartVolume && chartVolume.drawSeries(stocksData);

  if (chartRSI) {
    const stocksRSIData = chartRSI.calculateData(stocksData);
    chartRSI.drawSeries(stocksRSIData);
  }
};

const startStrategy = (stocksData) => {
  const startFrom = randNumber(1, chartPeriods.dayTimeFrameData.length);
  const dayInCalendar = chartPeriods.dayTimeFrameData[startFrom];
  const dayInCalendarUnix = moment(dayInCalendar.time).unix();

  const indexForStartFrom = chartPeriods.originalData.findIndex(
    data => data.time >= dayInCalendarUnix,
  );

  if (!~indexForStartFrom) {
    throw new Error('No index in original data');
  }

  const localStocksData = stocksData.slice(0, indexForStartFrom);

  // chartCandles.removeChart();
  //
  // chartCandles.addChart();
  // chartCandles.addSeries();

  chartPeriodsForHistory.setOriginalData(localStocksData);
  setPeriodForHistory(chartPeriods.period);
};

const nextStep = () => {
  let incrementValue = 0;
  const indexLocalStocksData = chartPeriodsForHistory.originalData.length;
  const originalStocksData = chartPeriods.getDataByPeriod(chartPeriodsForHistory.period);

  switch (chartPeriodsForHistory.period) {
    case 'minute': incrementValue = 1; break;

    case 'hour': {
      const lastCandle = chartPeriodsForHistory.originalData[indexLocalStocksData - 1];
      const nextCandle = chartPeriods.originalData[indexLocalStocksData];

      const lastCandleUnix = lastCandle.time;
      const currentDay = new Date(lastCandle.time * 1000).getDate();
      const nextCandleDay = new Date(nextCandle.time * 1000).getDate();

      let nextUnix;

      if (currentDay !== nextCandleDay) {
        nextUnix = nextCandle.time + 3599;
      } else {
        nextUnix = lastCandleUnix + 3600;
      }

      while (1) {
        const nextCandleInDay = chartPeriods.originalData[indexLocalStocksData + incrementValue];
        const nextCandleUnix = nextCandleInDay.time;

        if (nextCandleUnix <= nextUnix) {
          incrementValue += 1;
        } else {
          break;
        }
      }

      break;
    }

    case 'day': {
      const lastCandle = chartPeriodsForHistory.originalData[indexLocalStocksData - 1];
      const dayOfLastCandle = new Date(lastCandle.time * 1000).getDate();

      let i = 0;
      let targetDay;

      while (1) {
        const nextCandle = chartPeriods.originalData[indexLocalStocksData + i];
        const dayOfNextCandle = new Date(nextCandle.time * 1000).getDate();

        if (i === 0) {
          targetDay = dayOfNextCandle;
        }

        if (targetDay === dayOfNextCandle) {
          incrementValue += 1;
          i += 1;
        } else {
          break;
        }
      }

      break;
    }

    case 'month': {
      const lastCandle = chartPeriodsForHistory.originalData[indexLocalStocksData - 1];
      const monthOfLastCandle = new Date(lastCandle.time * 1000).getMonth();

      let i = 0;
      let targetMonth;

      while (1) {
        const nextCandle = chartPeriods.originalData[indexLocalStocksData + i];
        const monthOfNextCandle = new Date(nextCandle.time * 1000).getMonth();

        if (i === 0) {
          targetMonth = monthOfNextCandle;
        }

        if (targetMonth === monthOfNextCandle) {
          incrementValue += 1;
          i += 1;
        } else {
          break;
        }
      }

      break;
    }

    default: throw new Error('Undefined period');
  }

  const nextData = chartPeriods.originalData
    .slice(indexLocalStocksData, indexLocalStocksData + incrementValue);

  const resultData = [
    ...chartPeriodsForHistory.originalData,
    ...nextData,
  ];

  chartPeriodsForHistory.setOriginalData(resultData);

  const historyStocksData = chartPeriodsForHistory.getDataByPeriod(chartPeriodsForHistory.period);

  const lastCandle = historyStocksData[historyStocksData.length - 1];
  const nextCandle = originalStocksData[historyStocksData.length];

  chartCandles && chartCandles.drawSeries(historyStocksData);
  chartArea && chartArea.drawSeries(chartArea.calculateData(historyStocksData));
  chartSMA && chartSMA.drawSeries(chartSMA.calculateData(historyStocksData));
  chartADX && chartADX.drawSeries(chartADX.calculateData(historyStocksData));

  chartVolume && chartVolume.drawSeries(historyStocksData);

  if (chartRSI) {
    const stocksRSIData = chartRSI.calculateData(historyStocksData);
    chartRSI.drawSeries(stocksRSIData);
  }

  if (isActivePosition) {
    const {
      typeGame,
      stopLoss,
      takeProfit,
    } = strategy;

    const result = strategy.nextStep(lastCandle);

    if (result.isFinish) {
      let text = result.result.toString();

      if (result.result > 0) {
        text += ` (1:${result.takeProfitCoefficient})`;
      }

      chartCandles.addMarker({
        time: lastCandle.time,
        color: '#FF5252',
        text,
      });

      chartCandles.drawMarkers();

      isActivePosition = false;

      previousSLAndTP.forEach(elem => {
        chartDraw.removeSeries(elem);
      });

      previousSLAndTP = [];

      $winBuys.text(strategy.winBuys);
      $loseBuys.text(strategy.loseBuys);
      $numberBuys.text(strategy.loseBuys + strategy.winBuys);
    }

    if (result.isNewTakeProfit) {
      const nextCandlePlus = originalStocksData[historyStocksData.length + 1];

      const newTP = chartDraw.addSeries({
        start: {
          value: strategy.takeProfit,
          time: lastCandle.time,
        },

        end: {
          value: strategy.takeProfit,
          time: nextCandle.time,
        },

        options: {
          lineWidth: 1,
          color: '#4CAF50',
        },
      });

      previousSLAndTP.push(newTP);
    }

    if (!isActivePosition) {
      // $numberBuys.text(parseInt($numberBuys.text(), 10) + 1);
      // $balance.text(strategy.balance);
      $status.removeClass('active');
      $buy.prop('disabled', false);
      $sell.prop('disabled', false);
    }
  }
};

const randNumber = (min, max) => Math.floor(min + (Math.random() * ((max + 1) - min)));

const calculateSLAndTP = () => {
  const historyStocksData = chartPeriodsForHistory.getDataByPeriod(chartPeriodsForHistory.period);
  const originalStocksData = chartPeriods.getDataByPeriod(chartPeriodsForHistory.period);

  const currentCandle = historyStocksData[historyStocksData.length - 1];
  const nextCandle = originalStocksData[historyStocksData.length];

  const stockPrice = currentCandle.close;

  if ($stopLoss.val()) {
    stopLoss = Number($stopLoss.val());

    const differenceBetweenCloseAndSL = Math.abs(stockPrice - stopLoss);
    const percentFromBalance = 100 / (strategy.balance / differenceBetweenCloseAndSL);
    stocksToBuy = parseInt(stopLossPercent / percentFromBalance, 10);
    $numberStocks.val(stocksToBuy);
  } else {
    if ($numberStocks.val()) {
      stocksToBuy = parseInt($numberStocks.val(), 10);
    } else {
      stocksToBuy = parseInt(strategy.balance / stockPrice, 10);
    }

    if (typeGame === 1) {
      stopLoss = (stockPrice - ((strategy.balance * (stopLossPercent / 100)) / stocksToBuy));
    } else {
      stopLoss = (stockPrice + ((strategy.balance * (stopLossPercent / 100)) / stocksToBuy));
    }
  }

  const percent = 100 / (strategy.balance / Math.abs(stocksToBuy * (stockPrice - stopLoss)));

  const takeProfit = Strategy.floatNum(
    Math.abs(stockPrice + ((stockPrice - stopLoss) * defaultTakeProfitCoefficient)),
  );

  let nextTakeProfit;
  const stepBetweenSLAndTP = Math.abs((takeProfit - stopLoss) / 2);

  if (typeGame === 1) {
    nextTakeProfit = Strategy.floatNum(takeProfit + stepBetweenSLAndTP);
  } else {
    nextTakeProfit = Strategy.floatNum(takeProfit - stepBetweenSLAndTP);
  }

  if (tmpTP) {
    chartDraw.removeSeries(tmpTP);
    chartDraw.removeSeries(tmpTP3);
    chartDraw.removeSeries(tmpSL);
    chartDraw.removeSeries(tmpBreakeven);

    tmpTP = false;
    tmpTP3 = false;
    tmpSL = false;
    tmpBreakeven = false;
  }

  tmpTP = chartDraw.addSeries({
    start: {
      value: takeProfit,
      time: currentCandle.time,
    },

    end: {
      value: takeProfit,
      time: nextCandle.time,
    },

    options: {
      lineWidth: 1,
      color: '#4CAF50',
    },
  });

  tmpBreakeven = chartDraw.addSeries({
    start: {
      value: stockPrice,
      time: currentCandle.time,
    },

    end: {
      value: stockPrice,
      time: nextCandle.time,
    },

    options: {
      lineWidth: 1,
      color: '#ffbb00',
    },
  });

  tmpTP3 = chartDraw.addSeries({
    start: {
      value: nextTakeProfit,
      time: currentCandle.time,
    },

    end: {
      value: nextTakeProfit,
      time: nextCandle.time,
    },

    options: {
      lineWidth: 1,
      color: '#4CAF50',
    },
  });

  tmpSL = chartDraw.addSeries({
    start: {
      value: stopLoss,
      time: currentCandle.time,
    },

    end: {
      value: stopLoss,
      time: nextCandle.time,
    },

    options: {
      lineWidth: 1,
      color: '#FF5252',
    },
  });

  $percent.text(percent.toFixed(1));
  $stopLoss.attr('placeholder', stopLoss.toFixed(2));
  $numberStocks.attr('placeholder', stocksToBuy);
};

$(document).ready(() => {
  $balance.text(strategy.balance);

  $switch
    .on('click', () => {
      isHistoryModeActive = !isHistoryModeActive;

      if (!isHistoryModeActive) {
        location.reload(true);
      }

      $tradingActions.toggleClass('active');
      startStrategy(chartPeriods.originalData);
    });

  $(document).keydown(e => {
    if (e.keyCode === 39) nextStep();
  });

  $actionButtons
    .on('click', function () {
      const $button = $(this);
      const type = $button.attr('class');

      if (!isActivePosition) {
        typeGame = (type === 'buy') ? 1 : 2;
        calculateSLAndTP();
      } else if (
        (strategy.typeGame === 1 && type === 'sell')
        || (strategy.typeGame === 2 && type === 'buy')
      ) {
        const historyStocksData = chartPeriodsForHistory.getDataByPeriod(chartPeriodsForHistory.period);
        const lastCandle = historyStocksData[historyStocksData.length - 1];

        const {
          typeGame,
          stopLoss,
          takeProfit,
        } = strategy;

        const result = strategy.manualSell(lastCandle);

        if (result.isFinish) {
          let text = result.result.toString();

          if (result.result > 0) {
            text += ` (1:${result.takeProfitCoefficient})`;
          }

          chartCandles.addMarker({
            time: lastCandle.time,
            color: '#FF5252',
            text,
          });

          chartCandles.drawMarkers();

          isActivePosition = false;

          previousSLAndTP.forEach(elem => {
            chartDraw.removeSeries(elem);
          });

          previousSLAndTP = [];

          $winBuys.text(strategy.winBuys);
          $loseBuys.text(strategy.loseBuys);
          $numberBuys.text(strategy.loseBuys + strategy.winBuys);
        }

        if (!isActivePosition) {
          $status.removeClass('active');
          $buy.prop('disabled', false);
          $sell.prop('disabled', false);
        }
      }
    });

  $confirm
    .on('click', function () {
      if (!isActivePosition) {
        const valuePercent = parseFloat($percent.val());

        if (valuePercent > stopLossPercent) {
          alert(`> ${stopLossPercent}%`);
          return false;
        }

        const historyStocksData = chartPeriodsForHistory.getDataByPeriod(chartPeriodsForHistory.period);
        const originalStocksData = chartPeriods.getDataByPeriod(chartPeriodsForHistory.period);

        const candle = historyStocksData[historyStocksData.length - 1];
        const nextCandle = originalStocksData[historyStocksData.length];

        if (typeGame === 1) {
          $buy.prop('disabled', true);
        } else {
          $sell.prop('disabled', true);
        }

        strategy.newBuy({
          stockPrice: candle.close,
          typeGame,
          stopLoss,
          stocksToBuy,
        });

        $status.addClass('active');
        // $balance.text(strategy.balance);

        if (tmpTP) {
          chartDraw.removeSeries(tmpTP);
          chartDraw.removeSeries(tmpTP3);
          chartDraw.removeSeries(tmpSL);
          chartDraw.removeSeries(tmpBreakeven);

          tmpTP = false;
          tmpTP3 = false;
          tmpSL = false;
          tmpBreakeven = false;
        }

        const tp = chartDraw.addSeries({
          start: {
            value: strategy.takeProfit,
            time: candle.time,
          },

          end: {
            value: strategy.takeProfit,
            time: nextCandle.time,
          },

          options: {
            lineWidth: 1,
            color: '#4CAF50',
          },
        });

        const tp2 = chartDraw.addSeries({
          start: {
            value: strategy.nextTakeProfit,
            time: candle.time,
          },

          end: {
            value: strategy.nextTakeProfit,
            time: nextCandle.time,
          },

          options: {
            lineWidth: 1,
            color: '#4CAF50',
          },
        });

        const sl = chartDraw.addSeries({
          start: {
            value: strategy.stopLoss,
            time: candle.time,
          },

          end: {
            value: strategy.stopLoss,
            time: nextCandle.time,
          },

          options: {
            lineWidth: 1,
            color: '#FF5252',
          },
        });

        const breakeven = chartDraw.addSeries({
          start: {
            value: strategy.breakeven,
            time: candle.time,
          },

          end: {
            value: strategy.breakeven,
            time: nextCandle.time,
          },

          options: {
            lineWidth: 1,
            color: '#ffbb00',
          },
        });

        previousSLAndTP.push(tp, tp2, sl, breakeven);

        chartCandles.addMarker({
          time: candle.time,
          color: '#4CAF50',
        });

        chartCandles.drawMarkers();

        isActivePosition = true;
      }
    });

  $numberStocks
    .keyup(() => {
      calculateSLAndTP();
    });

  chartCandles.chart.subscribeClick(param => {
    if (targetSeriesForUpdate || isActivePaintMode) {
      return false;
    }

    if (!isActivePosition && isHistoryModeActive) {
      const price = chartCandles.series.coordinateToPrice(param.point.y);
      $stopLoss.val(price.toFixed(2));
      calculateSLAndTP();
    }
  });
});
