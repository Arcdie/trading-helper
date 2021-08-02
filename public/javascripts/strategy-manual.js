/* global
  chartCandles, chartArea, chartSMA, chartRSI, chartADX, chartDraw
  moment, Strategy, stocksData, chart,
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
let localStocksData = [];
let isActivePosition = false;
let isStrategyActive = false;

const strategy = new Strategy();

// Functions
const startStrategy = (stocksData) => {
  const startDate = stocksData[0].time.year;
  const endDate = (stocksData[stocksData.length - 1].time.year - 1);

  const numberYears = endDate - startDate;
  const numberDays = numberYears * 365;

  const startFrom = randNumber(1, numberDays);

  localStocksData = stocksData.slice(0, startFrom);

  chartCandles.drawSeries(localStocksData);
  chartArea.drawSeries(chartArea.calculateData(localStocksData));
  chartSMA.drawSeries(chartSMA.calculateData(localStocksData));
  chartRSI.drawSeries(chartRSI.calculateData(localStocksData));
  chartADX.drawSeries(chartADX.calculateData(localStocksData));
};

const nextStep = () => {
  const indexLocalStocksData = localStocksData.length;
  const nextData = stocksData[indexLocalStocksData];
  const nextDataPlus = stocksData[indexLocalStocksData + 1];

  localStocksData.push(nextData);

  chartCandles.drawSeries(localStocksData);
  chartArea.drawSeries(chartArea.calculateData(localStocksData));
  chartSMA.drawSeries(chartSMA.calculateData(localStocksData));
  chartRSI.drawSeries(chartRSI.calculateData(localStocksData));
  chartADX.drawSeries(chartADX.calculateData(localStocksData));

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
      isStrategyActive = !isStrategyActive;

      if (!isStrategyActive) {
        location.reload(true);
      }

      $tradingActions.toggleClass('active');
      startStrategy(stocksData);
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
