/* global
  moment,
  ChartPeriods, ChartDraw, Strategy,
  ChartCandles, ChartArea, ChartSMA, ChartVolume, ChartRSI, ChartADX,
  startAutoStrategy, drawSupportAndResistanceLines,
  isHistoryModeActive, setPeriodForHistory
*/

// $.JQuery
const $legend = $('#legend');
const $open = $legend.find('span.open');
const $close = $legend.find('span.close');
const $high = $legend.find('span.high');
const $low = $legend.find('span.low');

const $chartsViewElements = $('#charts-view div');

const $chartPeriods = $('#charts-periods div');

// Constants

// const chartRSI = new ChartRSI();
const chartADX = new ChartADX();
const chartCandles = new ChartCandles();
const chartSMA = new ChartSMA(chartCandles.chart);
const chartArea = new ChartArea(chartCandles.chart);

// const chartVolume = new ChartVolume();

const chartPeriods = new ChartPeriods();
const chartDraw = new ChartDraw(chartCandles.chart, chartCandles.series);

// const chartVolume = new ChartVolume(chartCandles.chart);

// const listCharts = [chartCandles];
const listCharts = [chartCandles, chartADX];

const getDefaultPeriod = () => {
  for (let i = 0; i < $chartPeriods.length; i += 1) {
    const $period = $($chartPeriods[i]);

    if ($period.hasClass('active')) {
      return $period.data('type');
    }
  }
};

// Functions
const setPeriod = period => {
  if (isHistoryModeActive) {
    setPeriodForHistory(period);
    return false;
  }

  const stocksData = chartPeriods.setPeriod(period);

  chartCandles.drawSeries(stocksData);
  chartArea.drawSeries(chartArea.calculateData(stocksData));
  chartSMA.drawSeries(chartSMA.calculateData(stocksData));
  chartADX.drawSeries(chartADX.calculateData(stocksData));

  // chartVolume.drawSeries(stocksData);

  // const stocksRSIData = chartRSI.calculateData(stocksData);
  // chartRSI.drawSeries(stocksRSIData);
};

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
  const resultGetData = await getStocksData('amd-12-21');

  chartPeriods.setOriginalData(resultGetData.data);
  setPeriod(getDefaultPeriod());

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

  $chartPeriods
    .on('click', function () {
      const $period = $(this);

      $chartPeriods.removeClass('active');
      $period.addClass('active');
      setPeriod($period.data('type'));
    });

  // startAutoStrategy();
  // drawSupportAndResistanceLines(stocksData);
});
