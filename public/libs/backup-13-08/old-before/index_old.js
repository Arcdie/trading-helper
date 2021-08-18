/* global LightweightCharts, Strategy, moment, constants, getGaps */

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
    containerName,
    containerDocument,
  } = constants;

  constants.containerWidth = containerDocument.width();
  constants.containerHeight = containerDocument.height();

  const chart = LightweightCharts.createChart(document.getElementById(containerName), {
    width: constants.containerWidth,
    height: constants.containerHeight,
  });

  chart.applyOptions({
    layout: {
      backgroundColor: '#F6FDFF',
    },

    crosshair: {
      mode: 0,
    },
  });

  const stocksData = await getStocksData('mu-16-21');

  stocksData.data
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

  const mainSeries = chart.addCandlestickSeries({
    upColor: '#000FFF',
    downColor: 'rgba(0, 0, 0, 0)',
    borderDownColor: '#000FFF',
    wickColor: '#000000',
  });

  mainSeries.setData(stocksData.data);

  // Strategy
  let strategy;
  let isActivePosition = false;

  // Theories
  const gaps = getGaps(stocksData.data);

  const newMarkers = [];

  if (gaps && gaps.length) {
    gaps.forEach(gap => {
      newMarkers.push({
        time: gap.time,
        position: 'belowBar',
        color: '#f68410',
        shape: 'arrowUp',
      })
    });

    stocksData.data.forEach((candle, index) => {
      if (!isActivePosition) {
        const doesExistGapInThisCandle = gaps.find(gap => gap.time === candle.time);

        if (doesExistGapInThisCandle) {
          isActivePosition = true;

          if (!strategy) {
            strategy = new Strategy({
              stockPrice: candle.open,
              typeGame: candle.typeGame,
            });
          } else {
            strategy.newBuy({
              stockPrice: candle.open,
              typeGame: candle.typeGame,
            });
          }

          console.log('number', strategy.numberBuys);
          console.log('newBalance', strategy.balance);

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
      } else {
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

    const sortedMarkers = newMarkers
      .sort((a, b) => {
        const unixA = moment(a.time).unix();
        const unixB = moment(b.time).unix();

        if (unixA < unixB) {
          return -1;
        } else if (unixA > unixB) {
          return 1;
        }

        return 0;
      });

    mainSeries.setMarkers(sortedMarkers);
  }

  if (strategy) {
    strategy.getInfo();
  }

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
