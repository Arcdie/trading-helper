/* global
  TrendLines,
  chartCandles,
  listCharts
  moment,
*/

// $.JQuery
const $paintPanel = $('#paint-panel');
const $paintObjects = $paintPanel.find('div');
const $trendLine = $paintPanel.find('.trend-line');
const $straightLine = $paintPanel.find('.straight-line');

// Constants

let numberClicks = 0;
let isActivePaintMode = false;
let targetSeriesForUpdate;

const lineSettings = {};

const trendLines = new TrendLines(chartCandles.chart);

// Functions
const changePaintMode = (type) => {
  isActivePaintMode = !isActivePaintMode;

  let handlerFunc;

  if (type === 'trend-line') {
    handlerFunc = drawTrendLineHandler;
    $trendLine.addClass('active');
  } else if (type === 'straight-line') {
    handlerFunc = drawStraightLineHandler;
    $straightLine.addClass('active');
  }

  if (isActivePaintMode) {
    chartCandles.chart.subscribeClick(handlerFunc);
  } else {
    chartCandles.chart.unsubscribeClick(drawTrendLineHandler);
    chartCandles.chart.unsubscribeClick(drawStraightLineHandler);

    $paintObjects.removeClass('active');
  }
};

const drawStraightLineHandler = (param) => {
  const price = chartCandles.series.coordinateToPrice(param.point.y);

  const momentDate = moment(param.time).add(-1, 'month');

  lineSettings.start = {
    value: price,
    time: moment(momentDate).add(-1, 'month').format('YYYY-MM-DD'),
  };

  lineSettings.end = {
    value: price,
    time: moment(momentDate).add(1, 'month').format('YYYY-MM-DD'),
  };

  trendLines.addSeries(lineSettings);
  targetSeriesForUpdate = false;
  changePaintMode();
};

const drawTrendLineHandler = (param) => {
  if (param.time) {
    const price = chartCandles.series.coordinateToPrice(param.point.y);

    if (numberClicks === 0) {
      lineSettings.start = {
        value: price,
        time: param.time,
      };

      numberClicks += 1;
    } else {
      numberClicks = 0;

      lineSettings.end = {
        value: price,
        time: param.time,
      };

      trendLines.addSeries(lineSettings);
      changePaintMode();
    }
  }
};

$(document).ready(() => {
  $paintObjects
    .on('click', function () {
      changePaintMode($(this).data('type'));
    });

  document.addEventListener('keypress', event => {
    const {
      charCode,
    } = event;

    if (charCode === 108) {
      changePaintMode('trend-line');
    } else if (charCode === 116) {
      changePaintMode('straight-line');
    } else if (charCode === 100) {
      if (targetSeriesForUpdate) {
        trendLines.removeSeries(targetSeriesForUpdate.series);
        targetSeriesForUpdate = false;
      }
    }
  });

  chartCandles.chart.subscribeClick((param) => {
    if (isActivePaintMode) {
      return false;
    }

    if (targetSeriesForUpdate) {
      const price = chartCandles.series.coordinateToPrice(param.point.y);

      if (targetSeriesForUpdate.isStartPart) {
        targetSeriesForUpdate.start = {
          value: price,
          time: param.time,
        };
      } else {
        targetSeriesForUpdate.end = {
          value: price,
          time: param.time,
        };
      }

      TrendLines.drawSeries(
        targetSeriesForUpdate.series,
        [targetSeriesForUpdate.start, targetSeriesForUpdate.end],
      );

      targetSeriesForUpdate = false;
      return false;
    }

    if (param.seriesPrices.size > 1) {
      const price = chartCandles.series.coordinateToPrice(param.point.y);
      const allowedVariation = price / (100 / 3);

      trendLines.setSeries.forEach(({ series }, index) => {
        const value = param.seriesPrices.get(series);

        if (value) {
          const valuePlusVariation = value + allowedVariation;
          const valueMinusVariation = value - allowedVariation;

          if (price < valuePlusVariation
            && price > valueMinusVariation) {
            targetSeriesForUpdate = trendLines.setSeries[index];
          }

          return false;
        }
      });

      if (!targetSeriesForUpdate) {
        return false;
      }

      const valuePlusVariation = price + allowedVariation;
      const valueMinusVariation = price - allowedVariation;

      const startValue = targetSeriesForUpdate.start.value;

      targetSeriesForUpdate.isStartPart = (startValue < valuePlusVariation
        && startValue > valueMinusVariation);
    }
  });
});
