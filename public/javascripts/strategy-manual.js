/* global
  moment,
  ChartPeriods, chartDraw, Strategy
  chartPeriods, chartCandles, chartArea, chartSMA, chartRSI, chartADX,
  $strategy, $switch, $numberBuys, $balance, $winBuys, $loseBuys
*/

// $.JQuery
const $tradingActions = $('.trading-actions');

const $status = $tradingActions.find('.status');

const $buy = $tradingActions.find('.buy');
const $sell = $tradingActions.find('.sell');
const $actionButtons = $tradingActions.find('button');

// constants
let typeGame = 0;
let isActivePosition = false;
let isHistoryModeActive = false;

const strategy = new Strategy();
const chartPeriodsForHistory = new ChartPeriods();

// Functions
const setPeriodForHistory = period => {
  const stocksData = chartPeriodsForHistory.setPeriod(period);

  chartCandles.drawSeries(stocksData);

  // chartArea.drawSeries(chartArea.calculateData(stocksData));
  // chartSMA.drawSeries(chartSMA.calculateData(stocksData));
  // chartADX.drawSeries(chartADX.calculateData(stocksData));

  // chartVolume.drawSeries(stocksData);

  // const stocksRSIData = chartRSI.calculateData(stocksData);
  // chartRSI.drawSeries(stocksRSIData);
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

  chartCandles.removeChart();

  chartCandles.addChart();
  chartCandles.addSeries();

  chartPeriodsForHistory.setOriginalData(localStocksData);
  setPeriodForHistory(chartPeriods.period);
};

const nextStep = () => {
  let incrementValue;

  switch (chartPeriodsForHistory.period) {
    case 'minute': incrementValue = 1; break;
    case 'hour': incrementValue = 6; break;
    case 'day': incrementValue = 39; break;
    case 'month': incrementValue = 39; break;
    default: throw new Error('Undefined period');
  }

  const indexLocalStocksData = chartPeriodsForHistory.originalData.length;
  const nextData = chartPeriods.originalData
    .slice(indexLocalStocksData, indexLocalStocksData + 6);

  const resultData = [
    ...chartPeriodsForHistory.originalData,
    ...nextData,
  ];

  chartPeriodsForHistory.setOriginalData(resultData);

  const stocksData = chartPeriodsForHistory.getDataByPeriod(chartPeriodsForHistory.period);

  chartCandles.drawSeries(stocksData);

  // chartArea.drawSeries(chartArea.calculateData(localStocksData));
  // chartSMA.drawSeries(chartSMA.calculateData(localStocksData));
  // chartRSI.drawSeries(chartRSI.calculateData(localStocksData));
  // chartADX.drawSeries(chartADX.calculateData(localStocksData));

  if (isActivePosition) {
    const {
      typeGame,
      stopLoss,
      takeProfit,
    } = strategy;

    const result = strategy.nextStep(nextData);

    if (result.isFinish) {
      let text = result.result.toString();

      if (result.result > 0) {
        text += ` (1:${result.takeProfitCoefficient})`;
      }

      chartCandles.addMarker({
        time: nextData.time,
        color: '#FF5252',
        text,
      });

      chartCandles.drawMarkers();

      isActivePosition = false;

      // $winBuys.text(strategy.winBuys);
      // $loseBuys.text(strategy.loseBuys);
      // $numberBuys.text(strategy.loseBuys + strategy.winBuys);
    }

    if (result.isNewTakeProfit) {
      chartDraw.addSeries({
        start: {
          value: strategy.takeProfit,
          time: nextData.time,
        },

        end: {
          value: strategy.takeProfit,
          time: nextDataPlus.time,
        },

        options: {
          lineWidth: 1,
          color: '#4CAF50',
        },
      });

      chartDraw.addSeries({
        start: {
          value: strategy.stopLoss,
          time: nextData.time,
        },

        end: {
          value: strategy.stopLoss,
          time: nextDataPlus.time,
        },

        options: {
          lineWidth: 1,
          color: '#FF5252',
        },
      });
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
      const className = $button.attr('class');

      if (!isActivePosition) {
        const candle = localStocksData[localStocksData.length - 1];
        const nextCandle = stocksData[localStocksData.length];

        if (className === 'buy') {
          typeGame = 1;
          $buy.prop('disabled', true);
        } else {
          typeGame = 2;
          $sell.prop('disabled', true);
        }

        strategy.newBuy({
          stockPrice: candle.close,
          typeGame,
        });

        $status.addClass('active');
        // $balance.text(strategy.balance);

        chartDraw.addSeries({
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

        chartDraw.addSeries({
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

        chartCandles.addMarker({
          time: candle.time,
          color: '#4CAF50',
        });

        chartCandles.drawMarkers();

        isActivePosition = true;
      } else {

      }
    });
});
