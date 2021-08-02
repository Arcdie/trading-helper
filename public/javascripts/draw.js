/* global
  LightweightCharts, ChartDraw,
  chartCandles, chartDraw,
  listCharts,
  moment
*/

// $.JQuery
const $paintPanel = $('#paint-panel');
const $paintObjects = $paintPanel.find('div');
const $trendLine = $paintPanel.find('.trend-line');
const $straightLine = $paintPanel.find('.straight-line');
const $horizontalLine = $paintPanel.find('.horizontal-line');

// Constants

let numberClicks = 0;
let isActivePaintMode = false;
let targetSeriesForUpdate;

const lineSettings = {};

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
  } else if (type === 'horizontal-line') {
    handlerFunc = drawHorizontalLineHandler;
    $horizontalLine.addClass('active');

    if (!isActivePaintMode) {
      $paintObjects.removeClass('active');
    }

    return true;
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

  chartDraw.addSeries(lineSettings);
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

      chartDraw.addSeries(lineSettings);
      changePaintMode();
    }
  }
};

const drawHorizontalLineHandler = (value) => {
  chartDraw.addPriceLine(value, true);
  changePaintMode();
};

$(document).ready(() => {
  chartDraw.drawPriceLinesByHistory();

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
    } else if (charCode === 104) {
      changePaintMode('horizontal-line');
    } else if (charCode === 100) {
      if (targetSeriesForUpdate) {
        chartDraw.removeSeries(targetSeriesForUpdate.series);
        targetSeriesForUpdate = false;
      }
    }
  });

  chartCandles.chart.subscribeClick((param) => {
    const price = chartCandles.series.coordinateToPrice(param.point.y);

    if ($horizontalLine.hasClass('active')) {
      drawHorizontalLineHandler(price);
    } else {
      const allowedVariation = price / (100 / 1);
      const valuePlusVariation = price + allowedVariation;
      const valueMinusVariation = price - allowedVariation;

      const doesExistPriceLine = chartDraw.setPriceLines.findIndex(
        ({ value }) => value < valuePlusVariation && value > valueMinusVariation,
      );

      if (~doesExistPriceLine) {
        chartDraw.removePriceLine(doesExistPriceLine);
      }
    }

    if (isActivePaintMode) {
      return false;
    }

    if (targetSeriesForUpdate) {
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

      ChartDraw.drawSeries(
        targetSeriesForUpdate.series,
        [targetSeriesForUpdate.start, targetSeriesForUpdate.end],
      );

      targetSeriesForUpdate = false;
      return false;
    }

    if (param.seriesPrices.size > 1) {
      const price = chartCandles.series.coordinateToPrice(param.point.y);
      const allowedVariation = price / (100 / 3);

      chartDraw.setSeries.forEach(({ series }, index) => {
        const value = param.seriesPrices.get(series);

        if (value) {
          const valuePlusVariation = value + allowedVariation;
          const valueMinusVariation = value - allowedVariation;

          if (price < valuePlusVariation
            && price > valueMinusVariation) {
            targetSeriesForUpdate = chartDraw.setSeries[index];
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
