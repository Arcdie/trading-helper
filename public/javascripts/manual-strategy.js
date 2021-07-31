/* global
  chartCandles, chartArea, chartSMA, chartRSI, chartADX
  moment, Strategy, stocksData, randNumber, chart
*/

// $.JQuery
const $strategy = $('.strategy');
const $switch = $strategy.find('.switch .slider');
const $balance = $strategy.find('.balance');
const $numberBuys = $strategy.find('.number-buys');
const $winBuys = $strategy.find('.win-buys');
const $loseBuys = $strategy.find('.lose-buys');

const $tradingActions = $('.trading-actions');
// const $next = $tradingActions.find('.next');

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

    if (typeGame === 1) {
      if (nextData.low <= stopLoss) {
        isActivePosition = false;
        strategy.loseBuy(nextData.low);
        $loseBuys.text(parseInt($loseBuys.text(), 10) + 1);
      } else if (nextData.high >= takeProfit) {
        isActivePosition = false;
        strategy.winBuy(nextData.high);
        $winBuys.text(parseInt($winBuys.text(), 10) + 1);
      }
    } else {
      if (nextData.high >= stopLoss) {
        isActivePosition = false;
        strategy.loseBuy(nextData.high);
        $loseBuys.text(parseInt($loseBuys.text(), 10) + 1);
      } else if (nextData.low <= takeProfit) {
        isActivePosition = false;
        strategy.winBuy(nextData.low);
        $winBuys.text(parseInt($winBuys.text(), 10) + 1);
      }
    }

    if (!isActivePosition) {
      $numberBuys.text(parseInt($numberBuys.text(), 10) + 1);
      $balance.text(strategy.balance);
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
        $balance.text(strategy.balance);

        const lineSeriesSL = chartCandles.chart.addLineSeries({
          color: 'red',
          lineWidth: 1,
          priceLineVisible: false,
          priceLineSource: false,
        });

        const lineSeriesTP = chartCandles.chart.addLineSeries({
          color: 'green',
          lineWidth: 1,
          priceLineVisible: false,
          priceLineSource: false,
        });

        const currentDay = moment(candle.date);
        const after5 = currentDay.add(5, 'days').format('YYYY-MM-DD');

        lineSeriesSL.setData([
          { time: candle.time, value: strategy.stopLoss },
          { time: after5.toString(), value: strategy.stopLoss },
        ]);

        lineSeriesTP.setData([
          { time: candle.time, value: strategy.takeProfit },
          { time: after5.toString(), value: strategy.takeProfit },
        ]);

        isActivePosition = true;
      } else {

      }
    });
});
