/* global
  ChartMain, StockData,
  draw, strategyManual
*/

/* Constants */
const AVAILABLE_PERIODS = new Map([
  ['MINUTE', 'minute'],
  ['HOUR', 'hour'],
  ['DAY', 'day'],
  ['MONTH', 'month'],
]);

const DEFAULT_PERIOD = AVAILABLE_PERIODS.get('DAY');

/* JQuery */
const $charts = $('.charts');

/* Settings */

const files = [{
  stockName: 'amd-12-21',
  isSingleMode: false,

  settings: {
    isActiveADX: false,
    isActiveRSI: false,
    isActiveVolume: false,
    isActiveLongSMA: true,
    isActiveShortSMA: true,
  },
}, {
  stockName: 'jd-14-21',
  isSingleMode: true,

  settings: {
    isActiveADX: false,
    isActiveRSI: false,
    isActiveVolume: false,
    isActiveLongSMA: true,
    isActiveShortSMA: true,
  },
}];

/* {
  stockName: 'jd-14-21',
  isSingleMode: true,

  settings: {
    isActiveADX: false,
    isActiveRSI: false,
    isActiveVolume: false,
    isActiveLongSMA: true,
    isActiveShortSMA: true,
  },
} */

/* Functions */
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

$(document).ready(async () => {
  let appendedElements = '';
  const heightStockElements = files.length > 1 ? 50 : 100;

  files.forEach(file => {
    const { settings } = file;
    appendedElements += `<div class="stock" style="height: ${heightStockElements}%" id="${file.stockName}">`;

    if (file.isSingleMode) {
      const uniqId = `${file.stockName}-${DEFAULT_PERIOD}`;

      appendedElements += `<div class="container" data-type="${DEFAULT_PERIOD}">
        <div class="menu">
          <div class="legend">
            <p class="values">
              ОТКР<span class="open">0</span>
              МАКС<span class="high">0</span>
              МИН<span class="low">0</span>
              ЗАКР<span class="close">0</span>
            </p>
          </div>

          <div class="periods">
            <div class="minute ${AVAILABLE_PERIODS.get('MINUTE') === DEFAULT_PERIOD && 'active'}" data-type="minute"><span>10M</span></div>
            <div class="hour ${AVAILABLE_PERIODS.get('HOUR') === DEFAULT_PERIOD && 'active'}" data-type="hour"><span>1Ч</span></div>
            <div class="day ${AVAILABLE_PERIODS.get('DAY') === DEFAULT_PERIOD && 'active'}" data-type="day"><span>Д</span></div>
            <div class="month ${AVAILABLE_PERIODS.get('MONTH') === DEFAULT_PERIOD && 'active'}" data-type="month"><span>Мес</span></div>
          </div>

          <div class="paint-panel">
            <div class="horizontal-line" data-type="horizontal-line">
              <img src="/images/horizontal-line.png" alt="-horizontal-line">
            </div>
          </div>
        </div>

        <div class="major chart" id="${uniqId}-candles"></div>`;

      if (settings.isActiveVolume) {
        appendedElements += `<div class="chart" id="${uniqId}-volume"></div>`;
      }

      if (settings.isActiveADX) {
        appendedElements += `<div class="chart" id="${uniqId}-adx"></div>`;
      }

      if (settings.isActiveRSI) {
        appendedElements += `<div class="chart" id="${uniqId}-rsi"></div>`;
      }

      appendedElements += '</div>';
    } else {
      const periods = [AVAILABLE_PERIODS.get('HOUR'), AVAILABLE_PERIODS.get('DAY')];
      const widthCharts = 100 / periods.length;

      periods.forEach(period => {
        const uniqId = `${file.stockName}-${period}`;

        let periodElement = '';

        switch (period) {
          case AVAILABLE_PERIODS.get('MINUTE'):
            periodElement = '<div class="minute active" data-type="minute"><span>10M</span></div>'; break;
          case AVAILABLE_PERIODS.get('HOUR'):
            periodElement = '<div class="hour active" data-type="hour"><span>1Ч</span></div>'; break;
          case AVAILABLE_PERIODS.get('DAY'):
            periodElement = '<div class="day active" data-type="day"><span>Д</span></div>'; break;
          case AVAILABLE_PERIODS.get('MONTH'):
            periodElement = '<div class="month active" data-type="month"><span>Мес</span></div>'; break;
          default: break;
        }

        appendedElements += `<div class="container not-single" style="width: ${widthCharts}%" data-type="${period}">
          <div class="menu">
            <div class="legend">
              <p class="values">
                ОТКР<span class="open">0</span>
                МАКС<span class="high">0</span>
                МИН<span class="low">0</span>
                ЗАКР<span class="close">0</span>
              </p>
            </div>

            <div class="periods">${periodElement}</div>

            <div class="paint-panel">
              <div class="horizontal-line" data-type="horizontal-line">
                <img src="/images/horizontal-line.png" alt="-horizontal-line">
              </div>
            </div>
          </div>

          <div class="major chart" id="${uniqId}-candles"></div>`;

        if (settings.isActiveVolume) {
          appendedElements += `<div class="chart" id="${uniqId}-volume"></div>`;
        }

        if (settings.isActiveADX) {
          appendedElements += `<div class="chart" id="${uniqId}-adx"></div>`;
        }

        if (settings.isActiveRSI) {
          appendedElements += `<div class="chart" id="${uniqId}-rsi"></div>`;
        }

        appendedElements += '</div>';
      });
    }

    appendedElements += '</div>';
  });

  $charts.append(appendedElements);

  await Promise.all(files.map(async file => {
    const stockData = new StockData();
    const resultGetData = await getStocksData(file.stockName);
    stockData.setOriginalData(resultGetData.data);

    file.charts = [];
    file.stockData = stockData;

    if (file.isSingleMode) {
      const chartMain = new ChartMain({
        stockName: file.stockName,
        period: DEFAULT_PERIOD,

        isActiveLongSMA: file.settings.isActiveLongSMA,
        isActiveShortSMA: file.settings.isActiveShortSMA,
      });

      file.charts.push(chartMain);

      const stocksData = file.stockData.getDataByPeriod(DEFAULT_PERIOD);

      chartMain.drawSeries(stocksData);

      chartMain.chartLongSMA && chartMain.chartLongSMA.drawSeries(
        chartMain.chartLongSMA.calculateData(stocksData),
      );

      chartMain.chartShortSMA && chartMain.chartShortSMA.drawSeries(
        chartMain.chartShortSMA.calculateData(stocksData),
      );
    } else {
      const periods = [AVAILABLE_PERIODS.get('HOUR'), AVAILABLE_PERIODS.get('DAY')];

      periods.forEach(period => {
        const chartMain = new ChartMain({
          stockName: file.stockName,
          period,

          isActiveLongSMA: file.settings.isActiveLongSMA,
          isActiveShortSMA: file.settings.isActiveShortSMA,
        });

        file.charts.push(chartMain);

        const stocksData = file.stockData.getDataByPeriod(period);

        chartMain.drawSeries(stocksData);

        chartMain.chartLongSMA && chartMain.chartLongSMA.drawSeries(
          chartMain.chartLongSMA.calculateData(stocksData),
        );

        chartMain.chartShortSMA && chartMain.chartShortSMA.drawSeries(
          chartMain.chartShortSMA.calculateData(stocksData),
        );
      });
    }
  }));

  files.forEach(file => {
    file.charts.forEach(chartWrapper => {
      chartWrapper.chart.subscribeCrosshairMove(param => {
        if (param.time) {
          const price = param.seriesPrices.get(chartWrapper.series);

          if (price) {
            const $legend = $(chartWrapper.containerDocument)
              .prev()
              .find('.legend');

            const $open = $legend.find('.open');
            const $close = $legend.find('.close');
            const $low = $legend.find('.low');
            const $high = $legend.find('.high');

            $open.text(price.open);
            $close.text(price.close);
            $low.text(price.low);
            $high.text(price.high);
          }
        }
      });
    });
  });

  $charts
    .on('click', '.periods div', function () {
      const $period = $(this);
      const $parent = $period.parent();
      const $stock = $parent.closest('.stock');

      $parent.find('div').removeClass('active');
      $period.addClass('active');

      const stockName = $stock.attr('id');
      const newPeriod = $period.data('type');

      const targetStock = files.find(file => file.stockName === stockName);

      if (!targetStock.isSingleMode) {
        return false;
      }

      const targetStockData = (targetStock.isActiveHistoryMode)
        ? targetStock.historyStockData : targetStock.stockData;

      targetStock.charts.forEach(chartWrapper => {
        chartWrapper.setPeriod(newPeriod);

        const stocksData = targetStockData.getDataByPeriod(newPeriod);

        chartWrapper.drawSeries(stocksData);

        chartWrapper.chartLongSMA && chartWrapper.chartLongSMA.drawSeries(
          chartWrapper.chartLongSMA.calculateData(stocksData),
        );

        chartWrapper.chartShortSMA && chartWrapper.chartShortSMA.drawSeries(
          chartWrapper.chartShortSMA.calculateData(stocksData),
        );
      });
    });

  // Init modules
  draw(files);
  strategyManual(files);
});
