/* global
  PERIOD_FOR_LONG_SMA
*/

/* Constants */
const BARS_TO_SKIP = PERIOD_FOR_LONG_SMA;

/* JQuery */

/* Settings */

/* Functions */

const tradingAuto = (file) => {
  const $containers = $(`#${file.stockName} .container`);
  $containers.prepend(`<div class="list-markers">
    <span class="current">0</span>/<span class="total">0</span>
  </div>`);

  file.charts.forEach(chartWrapper => {
    chartWrapper.targetCases = [];

    const stocksData = file.stockData.getDataByPeriod(chartWrapper.period);

    const longSMAData = chartWrapper.chartLongSMA && chartWrapper.chartLongSMA.calculateData(stocksData);
    const mediumSMAData = chartWrapper.chartMediumSMA && chartWrapper.chartMediumSMA.calculateData(stocksData);
    const shortSMAData = chartWrapper.chartShortSMA && chartWrapper.chartShortSMA.calculateData(stocksData);

    let isActiveTrade = false;

    for (let i = BARS_TO_SKIP; i < stocksData.length - 1; i += 1) {
      const candle = stocksData[i];

      if (longSMAData[i]
        && longSMAData[i] && longSMAData[i - 10]
        && mediumSMAData[i] && mediumSMAData[i - 3]
        && shortSMAData[i] && shortSMAData[i - 2]) {
        const { value: longSMAValue } = longSMAData[i];
        const { value: mediumSMAValue } = mediumSMAData[i];
        const { value: shortSMAValue } = shortSMAData[i];

        // const { value: prevLongSMAValue } = longSMAData[i - 5];
        // const { value: prevMediumSMAValue } = mediumSMAData[i - 3];
        // const { value: prevShortSMAValue } = shortSMAData[i - 2];

        if (isActiveTrade) {
          if (longSMAValue > mediumSMAValue
            || mediumSMAValue > shortSMAValue) {
            isActiveTrade = false;

            chartWrapper.addMarker({
              time: candle.time,
              color: 'red',
            });
          }
        } else {
          const percentPerPrice = candle.open * 0.04;
          const differenceBetweenShortAndMedium = (shortSMAValue - mediumSMAValue);
          const differenceBetweenOpenAndMediumSMA = (candle.open - mediumSMAValue);

          let doesLongValueGreaterThanPast = true;
          let doesMediumValueGreaterThanPast = true;
          let doesShortValueGreaterThanPast = true;

          for (let j = 1; j < 10; j += 1) {
            const { value: prevLongSMAValue } = longSMAData[i - j];
            doesLongValueGreaterThanPast = longSMAValue > prevLongSMAValue;

            if (!doesLongValueGreaterThanPast) {
              break;
            }
          }

          for (let j = 1; j < 3; j += 1) {
            const { value: prevMediumSMAValue } = mediumSMAData[i - j];
            doesMediumValueGreaterThanPast = mediumSMAValue > prevMediumSMAValue;

            if (!doesMediumValueGreaterThanPast) {
              break;
            }
          }

          for (let j = 1; j < 2; j += 1) {
            const { value: prevShortSMAValue } = shortSMAData[i - j];
            doesShortValueGreaterThanPast = shortSMAValue > prevShortSMAValue;

            if (!doesShortValueGreaterThanPast) {
              break;
            }
          }

          if (longSMAValue < mediumSMAValue
            && mediumSMAValue < shortSMAValue
            && doesLongValueGreaterThanPast
            && doesMediumValueGreaterThanPast
            && doesShortValueGreaterThanPast
            && differenceBetweenOpenAndMediumSMA <= percentPerPrice) {
            chartWrapper.addMarker({
              time: candle.time,
              color: '#ff9000',
              text: 'H',
            });

            chartWrapper.targetCases.push({
              time: candle.time,
              index: i,
            });

            isActiveTrade = true;
          }
        }
      }
    }
  });

  let doesExistTargetCase = false;

  file.charts.forEach(chartWrapper => {
    if (chartWrapper.targetCases.length) {
      doesExistTargetCase = true;
      chartWrapper.drawMarkers();
      chartWrapper.currentCaseIndex = 0;
      chartWrapper.totalCases = chartWrapper.targetCases.length;

      chartWrapper.chart
        .timeScale()
        .setVisibleLogicalRange({
          from: 0,
          to: 400,
        });

      const $listMarkers = $(`#${chartWrapper.containerName}`)
        .parent()
        .find('.list-markers');

      const $totalMarkers = $listMarkers.find('span.total');
      $totalMarkers.text(chartWrapper.totalCases);
    }
  });

  if (doesExistTargetCase) {
    $(document).keyup(e => {
      if (e.keyCode === 39
        || e.keyCode === 37) {
        const { mainPeriod } = file;

        const targetChartWrapper = file.charts.find(
          chartWrapper => chartWrapper.period === mainPeriod,
        );

        const $container = $(`#${targetChartWrapper.containerName}`).parent();

        const {
          totalCases,
          currentCaseIndex,
        } = targetChartWrapper;

        if (e.keyCode === 39) {
          if (currentCaseIndex === totalCases) {
            return true;
          }

          targetChartWrapper.currentCaseIndex += 1;
        } else {
          if (currentCaseIndex <= 1) {
            return true;
          }

          targetChartWrapper.currentCaseIndex -= 1;
        }

        const nextCase = targetChartWrapper.targetCases[targetChartWrapper.currentCaseIndex - 1];

        const $listMarkers = $container.find('.list-markers');
        const $curretMarker = $listMarkers.find('span.current');
        $curretMarker.text(targetChartWrapper.currentCaseIndex);

        const stocksData = file.stockData.getDataByPeriod(mainPeriod);
        const lData = stocksData.length;

        const shiftTo = lData - nextCase.index;

        targetChartWrapper.chart
          .timeScale()
          .scrollToPosition(-shiftTo);

        /*
        let timeMarker;

        if (Number.isInteger(nextCase.time)) {
          timeMarker = nextCase.time;
        } else {
          let {
            year,
            month,
            day,
          } = nextCase.time;

          if (month.toString().length === 1) {
            month = `0${month}`;
          }

          if (day.toString().length === 1) {
            day = `0${day}`;
          }

          timeMarker = `${year}-${month}-${day}`;
        }

        const coordinateX = targetChartWrapper.chart
          .timeScale()
          .timeToCoordinate(timeMarker);

        targetChartWrapper.chart
          .timeScale()
          .setVisibleLogicalRange({
            from: coordinateX,
            to: coordinateX + 400,
          });
        */
      }
    });
  }
};
