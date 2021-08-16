/* global
  moment,
  StockData, BalanceActivity,
  AVAILABLE_PERIODS
*/

/* Constants */
const startBalance = 1000;
const sumComission = 3; // $
const stopLossPercent = 2; // %
const takeProfitCoefficient = 2;

const defaultTypeGame = 1;

/* JQuery */
const $strategy = $('.trading-strategy');
const $tradingActions = $('.trading-actions');

const $switch = $strategy.find('.switch .slider');

const $balance = $strategy.find('.balance');
const $numberBuys = $strategy.find('.number-buys');
const $numberWinBuys = $strategy.find('.number-win-buys');
const $numberLoseBuys = $strategy.find('.number-lose-buys');
const $percentFromNumberBuys = $strategy.find('.percent-from-number-buys');
const $percentFromStartBalance = $strategy.find('.percent-from-start-balance');

const $statusTrade = $tradingActions.find('.status-trade');
const $stopLoss = $tradingActions.find('.stop-loss input');
const $numberStocksToBuy = $tradingActions.find('.number-stocks-to-buy input');
const $percentFromCurrentBalance = $tradingActions.find('.percent-from-current-balance span');

const $buy = $tradingActions.find('.buy');
const $sell = $tradingActions.find('.sell');
const $confirm = $tradingActions.find('.confirm');
const $actionButtons = $tradingActions.find('.choice button');

/* Settings */

let isActiveHistoryMode = false;

const buySettings = {};

const balanceActivity = new BalanceActivity({
  balance: startBalance,
  sumComission,
  stopLossPercent,
  takeProfitCoefficient,
  defaultTypeGame,
});

/* Functions */

const resetBuySettings = () => {
  buySettings.isInTrade = false;
  buySettings.typeGame = defaultTypeGame;
  buySettings.stopLoss = 0;
  buySettings.stocksToBuy = 0;
};

const nextStep = (files = []) => {
  const leadFile = files[0];
  const leadTimeframe = leadFile.mainPeriod;

  let indexLocalStocksData = leadFile.historyStockData.originalData.length;

  let incrementValue = 0;

  switch (leadTimeframe) {
    case 'minute': incrementValue = 1; break;

    case 'hour': {
      const lastCandle = leadFile.historyStockData.originalData[indexLocalStocksData - 1];
      const nextCandle = leadFile.stockData.originalData[indexLocalStocksData];

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
        const nextCandleInDay = leadFile.stockData.originalData[indexLocalStocksData + incrementValue];
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
      const lastCandle = leadFile.historyStockData.originalData[indexLocalStocksData - 1];
      const dayOfLastCandle = new Date(lastCandle.time * 1000).getDate();

      let i = 0;
      let targetDay;

      while (1) {
        const nextCandle = leadFile.stockData.originalData[indexLocalStocksData + i];
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
      const lastCandle = leadFile.historyStockData.originalData[indexLocalStocksData - 1];
      const monthOfLastCandle = new Date(lastCandle.time * 1000).getMonth();

      let i = 0;
      let targetMonth;

      while (1) {
        const nextCandle = leadFile.stockData.originalData[indexLocalStocksData + i];
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

  const nextDataForLeadFile = leadFile.stockData.originalData
    .slice(indexLocalStocksData, indexLocalStocksData + incrementValue);

  const resultData = [
    ...leadFile.historyStockData.originalData,
    ...nextDataForLeadFile,
  ];

  leadFile.historyStockData.setOriginalData(resultData);

  indexLocalStocksData = leadFile.historyStockData.originalData.length;
  const lastCandleInLeadFile = leadFile.historyStockData.originalData[indexLocalStocksData - 1];
  const timeLastCandleInLeadFile = lastCandleInLeadFile.time;

  files
    .filter(file => file.stockName !== leadFile.stockName)
    .forEach(file => {
      const indexLastCandleInFile = file.historyStockData.originalData.length;
      const lastCandleInFile = file.historyStockData.originalData[indexLastCandleInFile - 1];
      const timeLastCandleInFile = lastCandleInFile.time;

      incrementValue = 0;

      while (1) {
        const nextCandleInStockData = file.stockData.originalData[indexLastCandleInFile + incrementValue];
        const timeNextCandleInStockData = nextCandleInStockData.time;

        if (timeNextCandleInStockData <= timeLastCandleInLeadFile) {
          incrementValue += 1;
        } else {
          break;
        }
      }

      const nextData = file.stockData.originalData
        .slice(indexLastCandleInFile, indexLastCandleInFile + incrementValue);

      const resultData = [
        ...file.historyStockData.originalData,
        ...nextData,
      ];

      file.historyStockData.setOriginalData(resultData);
    });

  files.forEach(file => {
    file.charts.forEach(chartWrapper => {
      const targetStockData = file.historyStockData.getDataByPeriod(chartWrapper.period);

      chartWrapper.drawSeries(targetStockData);

      chartWrapper.chartLongSMA && chartWrapper.chartLongSMA.drawSeries(
        chartWrapper.chartLongSMA.calculateData(targetStockData),
      );

      chartWrapper.chartShortSMA && chartWrapper.chartShortSMA.drawSeries(
        chartWrapper.chartShortSMA.calculateData(targetStockData),
      );
    });
  });

  if (buySettings.isInTrade) {
    const { mainPeriod } = leadFile;

    const historyStocksData = leadFile.historyStockData.getDataByPeriod(mainPeriod);
    const lastCandle = historyStocksData[historyStocksData.length - 1];
    const result = balanceActivity.nextStep(lastCandle);

    if (result.isFinish) {
      finishTrade(result, lastCandle, files[0]);
    }
  }
};

const finishTrade = (result, lastCandle, file) => {
  let text = result.result.toString();

  if (result.result > 0) {
    text += ` (1:${result.takeProfitCoefficient})`;
  }

  file.charts.forEach(chartWrapper => {
    chartWrapper.addMarker({
      time: lastCandle.time,
      color: '#FF5252',
      text,
    });

    chartWrapper.drawMarkers();

    if (chartWrapper.setSeries.length) {
      chartWrapper.setSeries.forEach(element => {
        chartWrapper.removeSeries(element.series);
      });

      chartWrapper.setSeries = [];
    }
  });

  resetBuySettings();

  const results = balanceActivity.getInfo();

  $balance.text(results.balance);
  $numberBuys.text(results.numberBuys);
  $numberLoseBuys.text(results.numberLoseBuys);
  $numberWinBuys.text(results.numberWinBuys);
  $percentFromStartBalance.text(results.percentFromStartBalance);
  $percentFromNumberBuys.text(results.percentFromNumberBuys);

  $statusTrade.removeClass('active');
  $buy.prop('disabled', false);
  $sell.prop('disabled', false);
};

const calculateSLAndTP = (file, newStopLoss = false) => {
  const leadTimeframe = file.mainPeriod;

  const leadHistoryStocksData = file.historyStockData.getDataByPeriod(leadTimeframe);
  const leadOriginalStocksData = file.stockData.getDataByPeriod(leadTimeframe);

  const currentCandle = leadHistoryStocksData[leadHistoryStocksData.length - 1];
  const nextCandle = leadOriginalStocksData[leadHistoryStocksData.length];

  const stockPrice = currentCandle.close;

  file.charts.forEach(chartWrapper => {
    if (newStopLoss) {
      buySettings.stopLoss = Number($stopLoss.val());

      const differenceBetweenCloseAndSL = Math.abs(stockPrice - buySettings.stopLoss);
      const percentFromBalance = 100 / (balanceActivity.balance / differenceBetweenCloseAndSL);
      buySettings.stocksToBuy = parseInt(stopLossPercent / percentFromBalance, 10);
      $numberStocksToBuy.val(buySettings.stocksToBuy);
    } else {
      if ($numberStocksToBuy.val()) {
        buySettings.stocksToBuy = parseInt($numberStocksToBuy.val(), 10);
      } else {
        buySettings.stocksToBuy = parseInt(balanceActivity.balance / stockPrice, 10);
      }

      if (buySettings.typeGame === 1) {
        buySettings.stopLoss = (stockPrice - ((balanceActivity.balance * (stopLossPercent / 100)) / buySettings.stocksToBuy));
      } else {
        buySettings.stopLoss = (stockPrice + ((balanceActivity.balance * (stopLossPercent / 100)) / buySettings.stocksToBuy));
      }
    }

    const percentFromCurrentBalance = 100 / (balanceActivity.balance / Math.abs(buySettings.stocksToBuy * (stockPrice - buySettings.stopLoss)));

    const takeProfit = BalanceActivity.floatNum(
      Math.abs(stockPrice + ((stockPrice - buySettings.stopLoss) * takeProfitCoefficient)),
    );

    let nextTakeProfit;
    const stepBetweenSLAndTP = Math.abs((takeProfit - buySettings.stopLoss) / 2);

    if (buySettings.typeGame === 1) {
      nextTakeProfit = BalanceActivity.floatNum(takeProfit + stepBetweenSLAndTP);
    } else {
      nextTakeProfit = BalanceActivity.floatNum(takeProfit - stepBetweenSLAndTP);
    }

    if (chartWrapper.setSeries.length) {
      chartWrapper.setSeries.forEach(element => {
        chartWrapper.removeSeries(element.series);
      });

      chartWrapper.setSeries = [];
    }

    chartWrapper.addSeries({
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

    chartWrapper.addSeries({
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

    chartWrapper.addSeries({
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

    chartWrapper.addSeries({
      start: {
        value: buySettings.stopLoss,
        time: currentCandle.time,
      },

      end: {
        value: buySettings.stopLoss,
        time: nextCandle.time,
      },

      options: {
        lineWidth: 1,
        color: '#FF5252',
      },
    });

    $stopLoss.attr('placeholder', buySettings.stopLoss.toFixed(2));
    $numberStocksToBuy.attr('placeholder', buySettings.stocksToBuy);
    $percentFromCurrentBalance.text(percentFromCurrentBalance.toFixed(2));
  });
};

const randNumber = (min, max) => Math.floor(min + (Math.random() * ((max + 1) - min)));

const strategyManual = (files) => {
  $balance.text(startBalance);
  resetBuySettings();

  $switch
    .on('click', () => {
      isActiveHistoryMode = !isActiveHistoryMode;

      if (!isActiveHistoryMode) {
        return location.reload(true);
      }

      $tradingActions.toggleClass('active');

      let fileWithMinLengthDayCandles = files[0];
      let lCandlesInFile = fileWithMinLengthDayCandles.stockData.dayTimeFrameData.length;

      files.forEach(file => {
        const lDayCandles = file.stockData.dayTimeFrameData.length;

        if (lDayCandles < lCandlesInFile) {
          fileWithMinLengthDayCandles = file;
          lCandlesInFile = lDayCandles;
        }
      });

      const startFrom = randNumber(1, lCandlesInFile - 1);
      const dayInCalendar = fileWithMinLengthDayCandles.stockData.dayTimeFrameData[startFrom];
      const dayInCalendarUnix = moment(dayInCalendar.time).unix();

      files.forEach(file => {
        const { stockData } = file;

        const indexForStartFrom = stockData.originalData.findIndex(
          data => data.time >= dayInCalendarUnix,
        );

        if (!~indexForStartFrom) {
          throw new Error('No index in original data');
        }

        const choosedStockData = stockData.originalData.slice(0, indexForStartFrom);

        const historyStockData = new StockData();
        historyStockData.setOriginalData(choosedStockData);

        file.isActiveHistoryMode = true;
        file.historyStockData = historyStockData;

        file.charts.forEach(chartWrapper => {
          const targetStockData = file.historyStockData.getDataByPeriod(chartWrapper.period);

          chartWrapper.drawSeries(targetStockData);

          chartWrapper.chartLongSMA && chartWrapper.chartLongSMA.drawSeries(
            chartWrapper.chartLongSMA.calculateData(targetStockData),
          );

          chartWrapper.chartShortSMA && chartWrapper.chartShortSMA.drawSeries(
            chartWrapper.chartShortSMA.calculateData(targetStockData),
          );
        });
      });
    });

  $actionButtons
    .on('click', function () {
      const $button = $(this);
      const type = $button.attr('class');

      if (!buySettings.isInTrade) {
        buySettings.typeGame = (type === 'buy') ? 1 : 2;
        calculateSLAndTP(files[0]);
      } else if (
        (buySettings.typeGame === 1 && type === 'sell')
        || (buySettings.typeGame === 2 && type === 'buy')
      ) {
        const { mainPeriod } = files[0];

        const historyStocksData = files[0].historyStockData.getDataByPeriod(mainPeriod);
        const lastCandle = historyStocksData[historyStocksData.length - 1];

        const result = balanceActivity.manualSell(lastCandle);

        if (result.isFinish) {
          finishTrade(result, lastCandle, files[0]);
        }
      }
    });

  $confirm
    .on('click', () => {
      if (!buySettings.isInTrade) {
        const percentFromCurrentBalance = parseFloat($percentFromCurrentBalance.val());

        if (percentFromCurrentBalance > stopLossPercent) {
          alert(`> ${stopLossPercent}%`);
          return false;
        }

        const { mainPeriod } = files[0];

        const historyStocksData = files[0].historyStockData.getDataByPeriod(mainPeriod);
        const originalStocksData = files[0].stockData.getDataByPeriod(mainPeriod);

        const candle = historyStocksData[historyStocksData.length - 1];
        const nextCandle = originalStocksData[historyStocksData.length];

        if (buySettings.typeGame === 1) {
          $buy.prop('disabled', true);
        } else {
          $sell.prop('disabled', true);
        }

        buySettings.stockPrice = candle.close;
        balanceActivity.newBuy(buySettings);

        $statusTrade.addClass('active');

        files[0].charts.forEach(chartWrapper => {
          if (chartWrapper.setSeries.length) {
            chartWrapper.setSeries.forEach(element => {
              chartWrapper.removeSeries(element.series);
            });

            chartWrapper.setSeries = [];
          }

          chartWrapper.addSeries({
            start: {
              value: buySettings.takeProfit,
              time: candle.time,
            },

            end: {
              value: buySettings.takeProfit,
              time: nextCandle.time,
            },

            options: {
              lineWidth: 1,
              color: '#4CAF50',
            },
          });

          chartWrapper.addSeries({
            start: {
              value: balanceActivity.breakeven,
              time: candle.time,
            },

            end: {
              value: balanceActivity.breakeven,
              time: nextCandle.time,
            },

            options: {
              lineWidth: 1,
              color: '#ffbb00',
            },
          });

          chartWrapper.addSeries({
            start: {
              value: balanceActivity.nextTakeProfit,
              time: candle.time,
            },

            end: {
              value: balanceActivity.nextTakeProfit,
              time: nextCandle.time,
            },

            options: {
              lineWidth: 1,
              color: '#4CAF50',
            },
          });

          chartWrapper.addSeries({
            start: {
              value: buySettings.stopLoss,
              time: candle.time,
            },

            end: {
              value: buySettings.stopLoss,
              time: nextCandle.time,
            },

            options: {
              lineWidth: 1,
              color: '#FF5252',
            },
          });

          chartWrapper.addMarker({
            time: candle.time,
            color: '#4CAF50',
          });

          chartWrapper.drawMarkers();
        });

        buySettings.isInTrade = true;
      }
    });

  $(document)
    .keydown(e => {
      if (e.keyCode === 39) {
        nextStep(files);
      }
    });

  $numberStocksToBuy
    .keyup(() => {
      calculateSLAndTP(files[0]);
    });

  files[0].charts.forEach(chartWrapper => {
    chartWrapper.chart.subscribeClick(param => {
      const isActiveDrawMode = files[0].modes.some(mode => mode.isActive);

      if (isActiveDrawMode || buySettings.isInTrade) {
        return false;
      }

      if (isActiveHistoryMode) {
        const price = chartWrapper.series.coordinateToPrice(param.point.y);
        $stopLoss.val(price.toFixed(2));
        calculateSLAndTP(files[0], price);
      }
    });
  });
};
