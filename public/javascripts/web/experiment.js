/* global makeRequest */

/* Constants */

const URL_LOGIN = '/api/users/login';

const AVAILABLE_PERIODS = new Map([
  ['1M', '1m'],
  ['5M', '5m'],
  ['1H', '1h'],
  ['4H', '4h'],
  ['DAY', 'day'],
  ['MONTH', 'month'],
]);

const WORKING_PERIODS = [
  // AVAILABLE_PERIODS.get('MINUTE'),
  AVAILABLE_PERIODS.get('HOUR'),
  AVAILABLE_PERIODS.get('DAY'),
];

const DEFAULT_PERIOD = AVAILABLE_PERIODS.get('1M');

const isActiveCrosshairMode = true;

/* JQuery */
const $charts = $('.charts');

/* Functions */

$(document).ready(async () => {
  const stockData = new StockData();
  const resultGetData = await getStocksData(file.stockName);
  stockData.setOriginalData(resultGetData.data);

  file.charts = [];
  file.stockData = stockData;
  file.mainPeriod = DEFAULT_PERIOD;

  if (file.isSingleMode) {
    const chartMain = new ChartMain({
      stockName: file.stockName,
      period: DEFAULT_PERIOD,

      isActiveLongSMA: file.settings.isActiveLongSMA,
      isActiveMediumSMA: file.settings.isActiveMediumSMA,
      isActiveShortSMA: file.settings.isActiveShortSMA,
    });

    file.charts.push(chartMain);

    const stocksData = file.stockData.getDataByPeriod(DEFAULT_PERIOD);
    chartMain.drawSeries(stocksData);
  }
});
