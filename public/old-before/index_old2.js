/* global LightweightCharts, Strategy, moment, constants, getGaps */

// $.JQuery
const $legend = $('#legend');
const $open = $legend.find('span.open');
const $close = $legend.find('span.close');
const $high = $legend.find('span.high');
const $low = $legend.find('span.low');

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

$(document).ready(async () => {
  const {
    chartName,
    chartDocument,
  } = constants;

  constants.chartWidth = chartDocument.width();
  constants.chartHeight = chartDocument.height();

  const chart = LightweightCharts.createChart(document.getElementById(chartName), {
    width: constants.chartWidth,
    height: constants.chartHeight,
  });

  chart.applyOptions({
    layout: {
      backgroundColor: '#F6FDFF',
    },

    crosshair: {
      mode: 0,
    },
  });

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

  const stocksData = resultGetData.data;

  const mainSeries = chart.addCandlestickSeries({
    upColor: '#000FFF',
    downColor: 'rgba(0, 0, 0, 0)',
    borderDownColor: '#000FFF',
    wickColor: '#000000',
  });

  mainSeries.setData(stocksData);

  chart.subscribeCrosshairMove((param) => {
    if (param.time) {
      const price = param.seriesPrices.get(mainSeries);

      if (price) {
        $open.text(price.open);
        $close.text(price.close);
        $low.text(price.low);
        $high.text(price.high);
      }
    }
  });

  const newMarkers = [];
  const targetCandles = [];
  const lData = stocksData.length;

  for (let i = 0; i < lData; i += 1) {
    // const result = doesCandleABullHammer(stocksData[i]);
    //
    // if (result) {
    //   newMarkers.push({
    //     time: stocksData[i].time,
    //     position: 'belowBar',
    //     color: '#f68410',
    //     shape: 'arrowUp',
    //   });
    //
    //   targetCandles.push(stocksData[i]);
    // }
  }

  if (newMarkers.length) {
    mainSeries.setMarkers(newMarkers);
  }

  drawSimpleMA(chart, stocksData);
  drawRSI(chart, stocksData);
  // drawVolume(chart, stocksData);

  // Strategy
  /*

  let isActivePosition = false;
  const strategy = new Strategy();

  const lData = stocksData.data.length;
  const slicedData = stocksData.data.slice(lData - 60, lData);

  slicedData.forEach((candle, index) => {
    if (index % 10 === 0) {
      strategy.newBuy({
        stockPrice: candle.open,
        typeGame: 1,
      });

      const lineSeriesSL = chart.addLineSeries({
        color: 'red',
        priceLineVisible: false,
        priceLineSource: false,
      });

      const lineSeriesTP = chart.addLineSeries({
        color: 'green',
        priceLineVisible: false,
        priceLineSource: false,
      });

      const currentDay = moment(candle.date);
      const after5 = currentDay.add(5, 'days').format('YYYY-MM-DD');

      lineSeriesSL.setData([
        { time: candle.time, value: strategy.stopLoss },
        { time: after5.toString(), value: strategy.stopLoss },
      ]);

      lineSeriesTP.setData([
        { time: candle.time, value: strategy.takeProfit },
        { time: after5.toString(), value: strategy.takeProfit },
      ]);

      isActivePosition = true;
    }

    if (isActivePosition) {
      const {
        typeGame,
        stopLoss,
        takeProfit,
      } = strategy;

      if (typeGame === 1) {
        if (candle.low <= stopLoss) {
          isActivePosition = false;
          strategy.loseBuy(candle.low);

          newMarkers.push({
            time: candle.time,
            position: 'aboveBar',
            color: 'red',
            shape: 'arrowDown',
          });
        } else if (candle.high >= takeProfit) {
          isActivePosition = false;
          strategy.winBuy(candle.high);

          newMarkers.push({
            time: candle.time,
            position: 'aboveBar',
            color: 'green',
            shape: 'arrowDown',
          });
        }
      } else {
        if (candle.high >= stopLoss) {
          isActivePosition = false;
          strategy.loseBuy(candle.high);

          newMarkers.push({
            time: candle.time,
            position: 'aboveBar',
            color: 'red',
            shape: 'arrowDown',
          });
        } else if (candle.low <= takeProfit) {
          isActivePosition = false;
          strategy.winBuy(candle.low);

          newMarkers.push({
            time: candle.time,
            position: 'aboveBar',
            color: 'green',
            shape: 'arrowDown',
          });
        }
      }
    }
  });
  */

  // mainSeries.setMarkers(newMarkers);

  /* Set a marker
  series.setMarkers([
    {
        time: '2019-04-09',
        position: 'aboveBar',
        color: 'black',
        shape: 'arrowDown',
    },
    {
        time: '2019-05-31',
        position: 'belowBar',
        color: 'red',
        shape: 'arrowUp',
        id: 'id3',
    },
    {
        time: '2019-05-31',
        position: 'belowBar',
        color: 'orange',
        shape: 'arrowUp',
        id: 'id4',
        text: 'example',
        size: 2,
    },
  ]);
  */

  /* How draw a flexible line
  const lineSeries = chart.addLineSeries();

  lineSeries.setData([
    { time: '2021-03-08', value: 84.05 },
    { time: '2021-03-20', value: 87.27 },
  ]);
  */
});
