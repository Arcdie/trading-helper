/* global makeRequest
ChartCandles, ChartVolume, ChartPeriods */

/* Constants */

const URL_GET_1H_CANDLES = '/api/candles';
const URL_GET_ACTIVE_INSTRUMENTS = '/api/instruments/active';

const AVAILABLE_PERIODS = new Map([
  ['1M', '1m'],
  ['5M', '5m'],
  ['1H', '1h'],
  ['4H', '4h'],
  ['DAY', 'day'],
  ['MONTH', 'month'],
]);

const WORKING_PERIODS = [
  AVAILABLE_PERIODS.get('1M'),
  AVAILABLE_PERIODS.get('5M'),
  AVAILABLE_PERIODS.get('1H'),
  AVAILABLE_PERIODS.get('4H'),
  AVAILABLE_PERIODS.get('DAY'),
  AVAILABLE_PERIODS.get('MONTH'),
];

const DEFAULT_PERIOD = AVAILABLE_PERIODS.get('1M');

let choosedInstrumentId;
let choosenPeriod = DEFAULT_PERIOD;
let instrumentsDocs = [];

let chartCandles = {};
let chartVolume = {};
let chartPeriods = {};

/* JQuery */
const $instrumentsContainer = $('.instruments-container');
const $instrumentsList = $instrumentsContainer.find('.instruments-list .list');

const $chartPeriods = $('.chart-periods div');
const $rootContainer = document.getElementsByClassName('charts')[0];

const $legend = $('.legend');
const $open = $legend.find('span.open');
const $close = $legend.find('span.close');
const $high = $legend.find('span.high');
const $low = $legend.find('span.low');

let instrumentData;

/* Functions */
$(document).ready(async () => {
  const windowHeight = `${window.innerHeight - 20}px`;
  $rootContainer.style.height = windowHeight;

  const resultGetInstruments = await makeRequest({
    method: 'GET',
    url: `${URL_GET_ACTIVE_INSTRUMENTS}?isOnlyFutures=true`,
  });

  if (!resultGetInstruments || !resultGetInstruments.status) {
    alert(resultGetInstruments.message || 'Cant makeRequest URL_GET_ACTIVE_INSTRUMENTS');
    return true;
  }

  $instrumentsContainer
    .css({ maxHeight: windowHeight });

  $instrumentsList
    .css({ maxHeight: windowHeight });

  instrumentsDocs = resultGetInstruments.result;
  renderListInstruments(instrumentsDocs);

  WORKING_PERIODS.forEach(period => {
    const $period = $chartPeriods.parent().find(`.${period}`);

    $period.addClass('is_worked');

    if (period === DEFAULT_PERIOD) {
      $period.addClass('is_active');
    }
  });

  $chartPeriods
    .on('click', function () {
      const $period = $(this);
      const period = $period.data('period');

      $chartPeriods.removeClass('is_active');
      $period.addClass('is_active');

      choosenPeriod = period;

      if (chartCandles && chartCandles.chart) {
        const periodData = chartPeriods.setPeriod(
          period, [chartCandles.chart, chartVolume.chart],
        );

        chartCandles.drawSeries(periodData);
        chartVolume.drawSeries(periodData);
      }
    });

  $('.search input')
    .on('keyup', function () {
      const value = $(this).val().toLowerCase();

      let targetDocs = instrumentsDocs;

      if (value) {
        targetDocs = targetDocs.filter(doc => doc.name
          .toLowerCase()
          .includes(value),
        );
      }

      renderListInstruments(targetDocs);
    });

  $instrumentsList
    .on('click', '.instrument', async function () {
      const $instrument = $(this);
      const instrumentId = $instrument.data('instrumentid');

      if (choosedInstrumentId === instrumentId) {
        return true;
      }

      $instrumentsList
        .find('.instrument')
        .removeClass('is_active');

      console.log('start loading..');

      const resultGetCandles = await makeRequest({
        method: 'GET',
        url: `${URL_GET_1H_CANDLES}?instrumentId=${instrumentId}`,
      });

      if (!resultGetCandles || !resultGetCandles.status) {
        alert(resultGetCandles.message || `Cant makeRequest ${URL_GET_1H_CANDLES}`);
        return true;
      }

      console.log('end loading..');

      chartCandles = {};
      chartVolume = {};
      chartPeriods = {};
      $($rootContainer).empty();

      $instrument.addClass('is_active');

      if (!resultGetCandles.result || !resultGetCandles.result.length) {
        return true;
      }

      choosedInstrumentId = instrumentId;

      chartPeriods = new ChartPeriods();
      chartCandles = new ChartCandles($rootContainer);
      chartVolume = new ChartVolume($rootContainer);

      const listCharts = [chartCandles, chartVolume];

      chartPeriods.setPeriod(choosenPeriod, [chartCandles.chart, chartVolume.chart]);
      chartPeriods.setOriginalData(resultGetCandles.result, DEFAULT_PERIOD);

      instrumentData = chartPeriods.getDataByPeriod(choosenPeriod) || [];

      for (let i = 0; i < instrumentData.length; i += 1) {
        for (let j = 0; j < instrumentData.length; j += 1) {
          if (instrumentData[i].time === instrumentData[j].time && i !== j) {
            console.log(i, j);
          }
        }
      }

      chartCandles.drawSeries(instrumentData);
      // chartVolume.drawSeries(instrumentData);

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
    });
});

const renderListInstruments = targetDocs => {
  let appendInstrumentsStr = '';

  targetDocs.forEach(doc => {
    appendInstrumentsStr += `<div class="instrument" data-instrumentid=${doc._id}>${doc.name}</div>`;
  });

  $instrumentsList
    .empty()
    .append(appendInstrumentsStr);
};
