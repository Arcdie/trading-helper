/* global
  moment,
  StockData,
  AVAILABLE_PERIODS
*/

/* Constants */
const startBalance = 1000;

/* JQuery */
const $strategy = $('.trading-strategy');

const $switch = $strategy.find('.switch .slider');

const $balance = $strategy.find('.balance');
const $numberBuys = $strategy.find('.number-buys');
const $numberWinBuys = $strategy.find('.number-win-buys');
const $numberLoseBuys = $strategy.find('.number-lose-buys');

/* Settings */

let isActiveHistoryMode = false;

/* Functions */

const nextStep = (files = []) => {
  let leadTimeframe = AVAILABLE_PERIODS.get('HOUR');

  const fileWithSingleMode = files.find(file => file.isSingleMode);

  if (fileWithSingleMode) {
    leadTimeframe = fileWithSingleMode.charts[0].period;
  }

  files.forEach(file => {
    const indexLocalStocksData = file.historyStockData.originalData.length;

    let incrementValue = 0;

    switch (leadTimeframe) {
      case 'minute': incrementValue = 1; break;

      case 'hour': {
        const lastCandle = file.historyStockData.originalData[indexLocalStocksData - 1];
        const nextCandle = file.stockData.originalData[indexLocalStocksData];

        const lastCandleUnix = lastCandle.time;
        const currentDay = new Date(lastCandle.time * 1000).getDate();
        const nextCandleDay = new Date(nextCandle.time * 1000).getDate();

        let nextUnix;

        if (currentDay !== nextCandleDay) {
          nextUnix = nextCandle.time + 3599;
        } else {
          nextUnix = lastCandleUnix + 3600;
        }

        while (1) {
          const nextCandleInDay = file.stockData.originalData[indexLocalStocksData + incrementValue];
          const nextCandleUnix = nextCandleInDay.time;

          if (nextCandleUnix <= nextUnix) {
            incrementValue += 1;
          } else {
            break;
          }
        }

        break;
      }

      case 'day': {
        const lastCandle = file.historyStockData.originalData[indexLocalStocksData - 1];
        const dayOfLastCandle = new Date(lastCandle.time * 1000).getDate();

        let i = 0;
        let targetDay;

        while (1) {
          const nextCandle = file.stockData.originalData[indexLocalStocksData + i];
          const dayOfNextCandle = new Date(nextCandle.time * 1000).getDate();

          if (i === 0) {
            targetDay = dayOfNextCandle;
          }

          if (targetDay === dayOfNextCandle) {
            incrementValue += 1;
            i += 1;
          } else {
            break;
          }
        }

        break;
      }

      case 'month': {
        const lastCandle = file.historyStockData.originalData[indexLocalStocksData - 1];
        const monthOfLastCandle = new Date(lastCandle.time * 1000).getMonth();

        let i = 0;
        let targetMonth;

        while (1) {
          const nextCandle = file.stockData.originalData[indexLocalStocksData + i];
          const monthOfNextCandle = new Date(nextCandle.time * 1000).getMonth();

          if (i === 0) {
            targetMonth = monthOfNextCandle;
          }

          if (targetMonth === monthOfNextCandle) {
            incrementValue += 1;
            i += 1;
          } else {
            break;
          }
        }

        break;
      }

      default: throw new Error('Undefined period');
    }

    const nextData = file.stockData.originalData
      .slice(indexLocalStocksData, indexLocalStocksData + incrementValue);

    const resultData = [
      ...file.historyStockData.originalData,
      ...nextData,
    ];

    file.historyStockData.setOriginalData(resultData);

    file.charts.forEach(chartWrapper => {
      const targetStockData = file.historyStockData.getDataByPeriod(chartWrapper.period);

      chartWrapper.drawSeries(targetStockData);

      chartWrapper.chartLongSMA && chartWrapper.chartLongSMA.drawSeries(
        chartWrapper.chartLongSMA.calculateData(targetStockData),
      );

      chartWrapper.chartShortSMA && chartWrapper.chartShortSMA.drawSeries(
        chartWrapper.chartShortSMA.calculateData(targetStockData),
      );
    });
  });
};

const randNumber = (min, max) => Math.floor(min + (Math.random() * ((max + 1) - min)));

const strategyManual = (files) => {
  $balance.text(startBalance);

  $switch
    .on('click', () => {
      isActiveHistoryMode = !isActiveHistoryMode;

      if (!isActiveHistoryMode) {
        return location.reload(true);
      }

      let fileWithMinLengthDayCandles = files[0];
      let lCandlesInFile = fileWithMinLengthDayCandles.stockData.dayTimeFrameData.length;

      files.forEach(file => {
        const lDayCandles = file.stockData.dayTimeFrameData.length;

        if (lDayCandles < lCandlesInFile) {
          fileWithMinLengthDayCandles = file;
          lCandlesInFile = lDayCandles;
        }
      });

      const startFrom = randNumber(1, lCandlesInFile - 1);
      const dayInCalendar = fileWithMinLengthDayCandles.stockData.dayTimeFrameData[startFrom];
      const dayInCalendarUnix = moment(dayInCalendar.time).unix();

      files.forEach(file => {
        const { stockData } = file;

        const indexForStartFrom = stockData.originalData.findIndex(
          data => data.time >= dayInCalendarUnix,
        );

        if (!~indexForStartFrom) {
          throw new Error('No index in original data');
        }

        const choosedStockData = stockData.originalData.slice(0, indexForStartFrom);

        const historyStockData = new StockData();
        historyStockData.setOriginalData(choosedStockData);

        file.isActiveHistoryMode = true;
        file.historyStockData = historyStockData;

        file.charts.forEach(chartWrapper => {
          const targetStockData = file.historyStockData.getDataByPeriod(chartWrapper.period);

          chartWrapper.drawSeries(targetStockData);

          chartWrapper.chartLongSMA && chartWrapper.chartLongSMA.drawSeries(
            chartWrapper.chartLongSMA.calculateData(targetStockData),
          );

          chartWrapper.chartShortSMA && chartWrapper.chartShortSMA.drawSeries(
            chartWrapper.chartShortSMA.calculateData(targetStockData),
          );
        });
      });
    });

  $(document).keydown(e => {
    if (e.keyCode === 39) {
      nextStep(files);
    }
  });
};
