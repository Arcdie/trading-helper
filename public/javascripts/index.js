/* global
  ChartCandles, ChartArea, ChartSMA, ChartVolume, ChartRSI, ChartADX, Strategy, moment
*/

// $.JQuery
const $legend = $('#legend');
const $open = $legend.find('span.open');
const $close = $legend.find('span.close');
const $high = $legend.find('span.high');
const $low = $legend.find('span.low');

const $chartsViewElements = $('#charts-view div');

// Constants

let stocksData = [];
let stocksRSIData = [];

const chartRSI = new ChartRSI();
const chartADX = new ChartADX();
const chartCandles = new ChartCandles();
const chartSMA = new ChartSMA(chartCandles.chart);
const chartArea = new ChartArea(chartCandles.chart);
const chartVolume = new ChartVolume(chartCandles.chart);

const listCharts = [chartCandles, chartRSI, chartADX];

// Functions
const getStocksData = async (name) => {
  const response = await fetch(`/files?name=${name}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const result = await response.json();
  return result;
};

const handlerShowOrHideSeries = (seriesType, isActive) => {
  if (seriesType === 'chart-candles') {
    isActive ? chartCandles.hideSeries() : chartCandles.showSeries();
  } else if (seriesType === 'chart-area') {
    isActive ? chartArea.hideSeries() : chartArea.showSeries();
  }
};

$(document).ready(async () => {
  const resultGetData = await getStocksData('mu-16-21');

  resultGetData.data
    .sort((a, b) => {
      const unixA = moment(a.date).unix();
      const unixB = moment(b.date).unix();

      if (unixA < unixB) {
        return -1;
      } else if (unixA > unixB) {
        return 1;
      }

      return 0;
    })
    .forEach((candle) => {
      candle.time = moment(candle.date).format('YYYY-MM-DD');
    });

  stocksData = resultGetData.data;

  chartCandles.drawSeries(stocksData);
  // chartVolume.drawSeries(stocksData);
  // chartArea.drawSeries(chartArea.calculateData(stocksData));
  chartSMA.drawSeries(chartSMA.calculateData(stocksData));
  // chartADX.drawSeries(chartADX.calculateData(stocksData));

  stocksRSIData = chartRSI.calculateData(stocksData);
  chartRSI.drawSeries(stocksRSIData);

  let isCrossHairMoving = false;

  listCharts.forEach(elem => {
    const otherCharts = listCharts.filter(chart => chart.containerName !== elem.containerName);

    elem.chart.subscribeCrosshairMove(param => {
      if (!param.point || !param.time || isCrossHairMoving) {
        return true;
      }

      isCrossHairMoving = true;

      otherCharts.forEach(innerElem => {
        innerElem.chart.moveCrosshair(param.point);
      });

      isCrossHairMoving = false;

      elem.chart.timeScale().subscribeVisibleLogicalRangeChange(range => {
        otherCharts.forEach(innerElem => {
          innerElem.chart.timeScale().setVisibleLogicalRange(range);
        });
      });
    });
  });

  chartCandles.chart.subscribeCrosshairMove((param) => {
    if (param.time) {
      const price = param.seriesPrices.get(chartCandles.series);

      if (price) {
        $open.text(price.open);
        $close.text(price.close);
        $low.text(price.low);
        $high.text(price.high);
      }
    }
  });

  $chartsViewElements
    .on('click', function () {
      const $elem = $(this);
      const currentStatus = $elem.hasClass('active');

      $elem.toggleClass('active');
      handlerShowOrHideSeries($(this).data('type'), currentStatus);
    });

  startAutoStrategy();
});
