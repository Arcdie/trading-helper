/* global
  moment,
  ChartPeriods, ChartDraw, Strategy,
  ChartCandles, ChartArea, ChartSMA, ChartVolume, ChartRSI, ChartADX,
  startAutoStrategy, drawSupportAndResistanceLines,
  isHistoryModeActive, setPeriodForHistory
*/

// $.JQuery
const $rootContainer = document.getElementById('charts');

const $legend = $('#legend');
const $open = $legend.find('span.open');
const $close = $legend.find('span.close');
const $high = $legend.find('span.high');
const $low = $legend.find('span.low');

const $chartsViewElements = $('#charts-view div');
const $chartPeriods = $('#charts-periods div');

// Constants

const isActiveChartArea = true;
const isActiveChartSMALong = true;
const isActiveChartSMAShort = true;

const isActiveChartRSI = false;
const isActiveChartADX = false;
const isActiveChartVolume = false;

const isManyWindows = false;

const charts = [];

if (!isManyWindows) {
  const chartCandles = new ChartCandles($rootContainer, 'day');
  charts.push(chartCandles);
} else {
  $chartPeriods.each(period => {
    const $period = $(period);

    const periodName = $period.data('type');
    const chartCandles = new ChartCandles($rootContainer, periodName);
    charts.push(chartCandles);
  });
}

const chartVolume = isActiveChartVolume ? new ChartVolume($rootContainer) : false;
const chartRSI = isActiveChartRSI ? new ChartRSI($rootContainer) : false;
const chartADX = isActiveChartADX ? new ChartADX($rootContainer) : false;

const chartSMALong = isActiveChartSMALong ? new ChartSMA(chartCandles.chart, 50) : false;
const chartSMAShort = isActiveChartSMAShort ? new ChartSMA(chartCandles.chart, 20) : false;

const chartArea = isActiveChartArea ? new ChartArea(chartCandles.chart) : false;

const chartPeriods = new ChartPeriods();
const chartDraw = new ChartDraw(chartCandles.chart, chartCandles.series);

const listCharts = [];

[chartCandles, chartRSI, chartADX, chartVolume]
  .forEach(chart => chart && listCharts.push(chart));

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

  chartCandles && chartCandles.drawSeries(stocksData);
  chartArea && chartArea.drawSeries(chartArea.calculateData(stocksData));
  chartSMALong && chartSMALong.drawSeries(chartSMALong.calculateData(stocksData));
  chartSMAShort && chartSMAShort.drawSeries(chartSMAShort.calculateData(stocksData));
  chartADX && chartADX.drawSeries(chartADX.calculateData(stocksData));

  chartVolume && chartVolume.drawSeries(stocksData);

  if (chartRSI) {
    const stocksRSIData = chartRSI.calculateData(stocksData);
    chartRSI.drawSeries(stocksRSIData);
  }
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
  const resultGetData = await getStocksData('sber-12-21');

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
