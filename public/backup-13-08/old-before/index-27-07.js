/* global Chart, ChartRSI, Strategy, moment, constants, drawSimpleMA, drawRSI, drawVolume */

// $.JQuery
const $legend = $('#legend');
const $open = $legend.find('span.open');
const $close = $legend.find('span.close');
const $high = $legend.find('span.high');
const $low = $legend.find('span.low');

// Constants
const {
  containerName,
  containerDocument,
} = constants;

let stocksData = [];

const chart = new Chart({
  containerName,
  containerWidth: constants.containerWidth,
  containerHeight: constants.containerHeight,
});

const chartRSI = new ChartRSI();

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

const randNumber = (min, max) => Math.floor(min + Math.random() * (max + 1 - min));

$(document).ready(async () => {
  constants.containerWidth = containerDocument.width();
  constants.containerHeight = containerDocument.height();

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

  chart.drawMainSeries(stocksData);

  const calculatedData = chartRSI.calculateData(stocksData);
  chartRSI.drawSeries(calculatedData);

  let isCrossHairMoving = false;

  chart.chart.subscribeCrosshairMove(param => {
    if (!param.point) return;
    if (!param.time) return;
    if (isCrossHairMoving) return;

    isCrossHairMoving = true;
    chartRSI.chart.moveCrosshair(param.point);
    isCrossHairMoving = false;
  });

  chartRSI.chart.subscribeCrosshairMove(param => {
    if (!param.point) return;
    if (!param.time) return;
    if (isCrossHairMoving) return;

    isCrossHairMoving = true;
    chart.chart.moveCrosshair(param.point);
    isCrossHairMoving = false;
  });

  var isChartActive = false;
  var isAxisActive = false;

  chart.containerDocument.addEventListener('mousemove', () => {
    if (isChartActive) return;

    isChartActive = true;
    isAxisActive = false;

    chart.chart.applyOptions({
      crosshair: {
        horzLine: {
          visible: true,
          labelVisible: true,
        },
      },
    });

    chartRSI.chart.applyOptions({
      crosshair: {
        horzLine: {
          visible: false,
          labelVisible: false,
        },
      },
    });
  });

  chartRSI.containerDocument.addEventListener('mousemove', () => {
    if (isAxisActive) return;

    isAxisActive = true;
    isChartActive = false;
    chartRSI.chart.applyOptions({
      crosshair: {
        horzLine: {
          visible: true,
          labelVisible: true,
        },
      },
    });

    chart.chart.applyOptions({
      crosshair: {
        horzLine: {
          visible: false,
          labelVisible: false,
        },
      },
    });
  });

  chart.chart.timeScale().subscribeVisibleLogicalRangeChange(range => {
    chartRSI.chart.timeScale().setVisibleLogicalRange(range);
  });

  chartRSI.chart.timeScale().subscribeVisibleLogicalRangeChange(range => {
    chart.chart.timeScale().setVisibleLogicalRange(range);
  });

  /*
  let isCrossHairMoving = false;
  chart.chart.subscribeCrosshairMove(param => {
    // param.hoveredMarkerId
    if (!param.point) return;
    if (!param.time) return;
    if (isCrossHairMoving) return;

    [chartRSI].map(axis => {
      const axisChart = axis.chart;
      const axisTimeScale = axisChart.timeScale();
      const coord = axisTimeScale.timeToCoordinate(param.time);
      if (!coord) return;

      isCrossHairMoving = true;

      axisChart.moveCrosshair({
        ...param.point,
        x: coord
      });

      isCrossHairMoving = false;
    });
  });
  */

  // chart.chart.timeScale().subscribeVisibleTimeRangeChange((e) => {
  //   console.log(e);
  // });

  chart.chart.subscribeCrosshairMove((param) => {
    if (param.time) {
      const price = param.seriesPrices.get(chart.mainSeries);

      if (price) {
        $open.text(price.open);
        $close.text(price.close);
        $low.text(price.low);
        $high.text(price.high);
      }
    }
  });

  drawSimpleMA(chart, stocksData);
  // drawRSI(chart, stocksData);
  // drawVolume(chart, stocksData);
});
