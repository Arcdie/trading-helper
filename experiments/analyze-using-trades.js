const moment = require('moment');
const Emitter = require('events');
const WebSocketClient = require('ws');

const log = require('../libs/logger')(module);

const {
  getQueue,
  getPrecision,
} = require('../libs/support');

const {
  getActiveInstruments,
} = require('../controllers/instruments/utils/get-active-instruments');

const {
  createUserTradeBoundForStatistics,
} = require('../controllers/user-trade-bounds/utils/create-user-trade-bound-for-statistics');

const {
  PRICE_JUMPS_CONSTANTS,
} = require('../controllers/strategies/constants');

const {
  TYPES_EXIT,
  TYPES_TRADES,
} = require('../controllers/user-trade-bounds/constants');

const emitter = new Emitter();

const WORK_AMOUNT = 10;
const TIMEFRAME = '1h';
const TYPE_TRADE = TYPES_TRADES.get('PRICE_REBOUND');

module.exports = async () => {
  try {
    return;
    console.time('experiment');
    console.log('Experiment started');

    const settings = {
      factorForPriceChange: PRICE_JUMPS_CONSTANTS.FACTOR_FOR_PRICE_CHANGE,
      considerBtcMircoTrend: PRICE_JUMPS_CONSTANTS.DOES_CONSIDER_BTC_MICRO_TREND,
      considerFuturesMircoTrend: PRICE_JUMPS_CONSTANTS.DOES_CONSIDER_FUTURES_MICRO_TREND,

      stopLossPercent: 1,
      candlesForCalculateAveragePercent: 24,
    };

    const resultGetInstruments = await getActiveInstruments({
      isOnlyFutures: true,
    });

    if (!resultGetInstruments || !resultGetInstruments.status) {
      log.warn(resultGetInstruments.message || 'Cant getActiveInstruments');
      return false;
    }

    let instrumentsDocs = (resultGetInstruments.result || []);
      // .filter(d => d.name === 'IOTXUSDTPERP');

    instrumentsDocs = instrumentsDocs.slice(22 + 30 + 29, instrumentsDocs.length);

    if (!instrumentsDocs.length) {
      log.warn('No active instruments');
      return false;
    }

    const wsConnectionHost = 'localhost';
    const wsConnectionPort = 3105;

    const client = await websocketConnect({ host: wsConnectionHost, port: wsConnectionPort });

    // 1 december 2021 - 1 january 2022
    const startDate = moment.unix(1638316800).utc();
    const endDate = moment.unix(1640995200).utc();

    const targetDates = [];
    const tmpDate = moment(startDate);
    const incrementProcessedInstruments = processedInstrumentsCounter(instrumentsDocs.length);

    while (1) {
      targetDates.push({
        date: moment(tmpDate),
        dateUnix: moment(tmpDate).unix(),
        day: moment(tmpDate).format('DD'),
        month: moment(tmpDate).format('MM'),
        year: moment(tmpDate).format('YYYY'),
      });

      tmpDate.add(1, 'days');

      if (tmpDate.unix() === endDate.unix()) {
        break;
      }
    }

    for await (const instrumentDoc of instrumentsDocs) {
      const newTrades = [];

      const queues = getQueue(targetDates, 4);

      for await (const queue of queues) {
        const startDate = moment(queue[0].date);
        const endDate = moment(queue[queue.length - 1].date).add(1, 'hours');

        const trades = await loadTrades(client, {
          instrumentName: instrumentDoc.name,

          startDate,
          endDate,
        });

        if (!trades) {
          log.warn(`${instrumentDoc.name}, no trades`);
          continue;
        }

        instrumentDoc.my_trades = [];

        calculateCandles(instrumentDoc, trades, settings);

        newTrades.push(...instrumentDoc.my_trades);
      }

      await Promise.all(newTrades.map(async myTrade => {
        const resultCreateBound = await createUserTradeBoundForStatistics({
          ...myTrade,
          instrumentId: instrumentDoc._id,

          typeTrade: TYPE_TRADE,
          typeExit: TYPES_EXIT.get('DEACTIVATED'),
        });

        if (!resultCreateBound || !resultCreateBound.status) {
          const message = resultCreateBound.message || 'Cant createUserTradeBoundForStatistics';

          log.warn(message);
          return null;
        }
      }));

      incrementProcessedInstruments();
      log.info(`Ended ${instrumentDoc.name}`);
    }

    console.timeEnd('experiment');
  } catch (error) {
    console.log(error);
  }
};

const loadTrades = async (wsClient, {
  instrumentName,

  startDate,
  endDate,
}) => {
  wsClient.send(JSON.stringify({
    actionName: 'request',
    data: {
      requestName: 'tradesData',
      instrumentName,
      startDate,
      endDate,
    },
  }));

  const trades = [];

  await (() => {
    return new Promise(resolve => {
      emitter.on('tradesData', parsedData => {
        if (!parsedData.status) {
          console.log(parsedData.message || 'Cant get trades data');
          return resolve();
        }

        if (parsedData.isEnd) {
          return resolve();
        } else {
          const queues = getQueue(parsedData.result, 100000);

          queues.forEach(queue => {
            trades.push(...queue);
          });
        }
      });
    });
  })();

  emitter.removeAllListeners('tradesData');

  if (!trades.length) {
    return false;
  }

  const splitByHours = [];
  let newSplit = [trades[0]];

  let hour = new Date(trades[0][2]).getUTCHours();

  for (let i = 1; i < trades.length; i += 1) {
    const hourOfTrade = new Date(trades[i][2]).getUTCHours();

    if (hourOfTrade !== hour) {
      hour = hourOfTrade;

      splitByHours.push(
        newSplit.map(tradeData => {
          const [
            price,
            quantity,
            time,
          ] = tradeData;

          const originalTimeUnix = parseInt(
            (new Date(time).setSeconds(0)) / 1000, 10,
          );

          return {
            price: parseFloat(price),
            quantity: parseFloat(quantity),
            originalTimeUnix,
          };
        }),
      );

      newSplit = [trades[i]];
      continue;
    }

    newSplit.push(trades[i]);
  }

  return splitByHours;
};

const calculateCandles = (instrumentDoc, trades, settings) => {
  let periods = trades;

  switch (TIMEFRAME) {
    case '5m': {
      const coeff = 5 * 60 * 1000;
      let timeUnixOfFirstCandle = periods[0][0].originalTimeUnix;

      const divider = timeUnixOfFirstCandle % 60;

      if (divider !== 0) {
        let incr = 1;
        const next5mInterval = (Math.ceil((timeUnixOfFirstCandle * 1000) / coeff) * coeff) / 1000;

        periods.shift();

        console.log('Started while loop');

        while (1) {
          const firstCandleTimeOfPeriod = periods[incr][0].originalTimeUnix;

          if (firstCandleTimeOfPeriod === next5mInterval) {
            timeUnixOfFirstCandle = firstCandleTimeOfPeriod;
            break;
          }

          incr += 1;
          periods.shift();
        }
      }

      let newPeriod = [];
      const newPeriods = [];

      let current5mInterval = timeUnixOfFirstCandle;
      let next5mInterval = current5mInterval + 300;

      periods.forEach(period => {
        const timeUnixOfFirstCandleInPeriod = period[0].originalTimeUnix;

        if (timeUnixOfFirstCandleInPeriod < next5mInterval) {
          newPeriod.push(...period);
          return true;
        }

        newPeriods.push(newPeriod);

        newPeriod = [...period];
        current5mInterval = next5mInterval;
        next5mInterval += 300;
      });

      periods = newPeriods;

      break;
    }

    case '1h': {
      let timeUnixOfFirstCandle = periods[0][0].originalTimeUnix;

      const divider = timeUnixOfFirstCandle % 3600;

      if (divider !== 0) {
        let incr = 1;
        const next1hInterval = (timeUnixOfFirstCandle - divider) + 3600;

        periods.shift();

        console.log('Started while loop');

        while (1) {
          const firstCandleTimeOfPeriod = periods[incr][0].originalTimeUnix;

          if (firstCandleTimeOfPeriod === next1hInterval) {
            timeUnixOfFirstCandle = firstCandleTimeOfPeriod;
            break;
          }

          incr += 1;
          periods.shift();
        }
      }

      let newPeriod = [];
      const newPeriods = [];

      let current1hInterval = timeUnixOfFirstCandle;
      let next1hInterval = current1hInterval + 3600;

      periods.forEach(period => {
        const timeUnixOfFirstCandleInPeriod = period[0].originalTimeUnix;

        if (timeUnixOfFirstCandleInPeriod < next1hInterval) {
          const queues = getQueue(period, 100000);

          queues.forEach(queue => {
            newPeriod.push(...queue);
          });

          return true;
        }

        newPeriods.push(newPeriod);

        newPeriod = [];

        const queues = getQueue(period, 100000);

        queues.forEach(queue => {
          newPeriod.push(...queue);
        });

        current1hInterval = next1hInterval;
        next1hInterval += 3600;
      });

      periods = newPeriods;

      break;
    }

    default: break;
  }

  const candlesData = [];
  const lPeriods = periods.length;

  for (let i = 0; i < lPeriods; i += 1) {
    const period = periods[i];
    const lTrades = period.length;

    let doesExistStrategy = false;

    const open = period[0].price;
    const time = period[0].originalTimeUnix;

    let sumVolume = 0;
    let close = open;
    let minLow = open;
    let maxHigh = open;

    for (let j = 0; j < lTrades; j += 1) {
      const tradePrice = period[j].price;

      const isClosed = j === lTrades - 1;

      if (tradePrice < minLow) {
        minLow = tradePrice;
      }

      if (tradePrice > maxHigh) {
        maxHigh = tradePrice;
      }

      close = tradePrice;
      sumVolume += period[j].quantity;

      const doesExistActiveTrade = instrumentDoc.my_trades.some(
        myTrade => myTrade.isActive,
      );

      if (!doesExistStrategy && !doesExistActiveTrade) {
        const result = strategyFunction({
          candlesData,
        }, {
          open,
          close,
          isClosed,
          low: minLow,
          high: maxHigh,
          originalTimeUnix: time,
        }, settings);

        if (result) {
          doesExistStrategy = true;

          createMyTrade(instrumentDoc, {
            isLong: result.isLong,
            stopLossPercent: settings.stopLossPercent,
            takeProfitPercent: settings.stopLossPercent,

            buyPrice: result.isLong ? close : 0,
            sellPrice: !result.isLong ? close : 0,

            tradeStartedAt: time,
          });
        }
      }

      checkMyTrades(instrumentDoc, {
        price: close,
        timeUnix: time,
      });
    }

    candlesData.push({
      time,
      originalTime: new Date(time * 1000),
      originalTimeUnix: time,

      open,
      close,
      low: minLow,
      high: maxHigh,
      volume: sumVolume,
    });
  }

  const lastCandle = candlesData[candlesData.length - 1];

  checkMyTrades(instrumentDoc, {
    price: lastCandle.close,
    timeUnix: lastCandle.originalTimeUnix,
  }, true);
};

const strategyFunction = ({
  candlesData,
}, currentCandle, settings) => {
  if (!currentCandle.isClosed) {
    return false;
  }

  const lCandlesData = candlesData.length;

  if (!lCandlesData || lCandlesData < settings.candlesForCalculateAveragePercent) {
    return false;
  }

  let averagePercent = 0;
  const lastCandle = candlesData[lCandlesData - 1];

  const isLongLastCandle = lastCandle.close > lastCandle.open;
  const isLongCurrentCandle = currentCandle.close > currentCandle.open;

  if (!isLongLastCandle) {
    return false;
  }

  for (let j = lCandlesData - settings.candlesForCalculateAveragePercent; j < lCandlesData; j += 1) {
    const candle = candlesData[j];
    const isLong = candle.close > candle.open;

    const differenceBetweenPrices = isLong ?
      candle.high - candle.open : candle.open - candle.low;
    const percentPerPrice = 100 / (candle.open / differenceBetweenPrices);

    averagePercent += percentPerPrice;
  }

  averagePercent = parseFloat(
    (averagePercent / settings.candlesForCalculateAveragePercent).toFixed(2),
  );

  // const differenceBetweenPrices = Math.abs(
  //   isLongLastCandle ? lastCandle.high - lastCandle.open : lastCandle.open - lastCandle.low,
  // );

  const differenceBetweenPrices = Math.abs(lastCandle.open - lastCandle.close);
  const percentPerPrice = 100 / (lastCandle.open / differenceBetweenPrices);

  if (percentPerPrice > (averagePercent * settings.factorForPriceChange)
    && !isLongCurrentCandle) {
    return {
      isLong: false,
      ...currentCandle,
      averagePercent,
    };
  }
};

const createMyTrade = (instrumentDoc, options) => {
  const price = options.isLong ?
    options.buyPrice : options.sellPrice;

  const stepSize = instrumentDoc.step_size;
  const stepSizePrecision = getPrecision(stepSize);
  let quantity = WORK_AMOUNT / price;

  if (quantity < stepSize) {
    return true;
  }

  const remainder = quantity % stepSize;

  if (remainder !== 0) {
    quantity -= remainder;

    if (quantity < stepSize) {
      return true;
    }
  }

  quantity = parseFloat(quantity.toFixed(stepSizePrecision));

  const stopLossPercent = options.stopLossPercent / 100;
  const takeProfitPercent = options.takeProfitPercent / 100;

  const stopLossStepSize = parseFloat((price * stopLossPercent).toFixed(instrumentDoc.price_precision));
  const profitStepSize = parseFloat((price * takeProfitPercent).toFixed(instrumentDoc.price_precision));

  if (options.isLong) {
    options.takeProfitPrice = price + (profitStepSize * 2);
    options.stopLossPrice = price - stopLossStepSize;
  } else {
    options.takeProfitPrice = price - (profitStepSize * 2);
    options.stopLossPrice = price + stopLossStepSize;
  }

  options.isActive = true;
  options.quantity = quantity;
  options.profitStepSize = profitStepSize;
  options.index = instrumentDoc.my_trades.length;
  options.stopLossPrice = parseFloat(options.stopLossPrice.toFixed(instrumentDoc.price_precision));
  options.takeProfitPrice = parseFloat(options.takeProfitPrice.toFixed(instrumentDoc.price_precision));

  instrumentDoc.my_trades.push(options);
};

const checkMyTrades = (instrumentDoc, { price, timeUnix }, isFinish = false) => {
  if (!instrumentDoc.my_trades || !instrumentDoc.my_trades.length) {
    return true;
  }

  instrumentDoc.my_trades
    .filter(myTrade => myTrade.isActive)
    .forEach(myTrade => {
      if ((myTrade.isLong && price > myTrade.takeProfitPrice)
        || (!myTrade.isLong && price < myTrade.takeProfitPrice)) {
        let incrValue = 1;
        let newStopLoss;
        let newTakeProfit;

        if (myTrade.isLong) {
          while (1) {
            newTakeProfit = price + (myTrade.profitStepSize * incrValue);
            if (newTakeProfit > price) break;
            incrValue += 1;
          }

          newStopLoss = (newTakeProfit - (myTrade.profitStepSize * 2));
        } else {
          while (1) {
            newTakeProfit = price - (myTrade.profitStepSize * incrValue);
            if (newTakeProfit < price) break;
            incrValue += 1;
          }

          newStopLoss = (newTakeProfit + (myTrade.profitStepSize * 2));
        }

        newStopLoss = parseFloat(newStopLoss.toFixed(instrumentDoc.price_precision));

        myTrade.stopLossPrice = newStopLoss;
        myTrade.takeProfitPrice = parseFloat(newTakeProfit.toFixed(instrumentDoc.price_precision));
      }

      if (isFinish
        || (myTrade.isLong && price < myTrade.stopLossPrice)
        || (!myTrade.isLong && price > myTrade.stopLossPrice)) {
        myTrade.isActive = false;
        myTrade.tradeEndedAt = timeUnix;

        if (myTrade.isLong) {
          myTrade.sellPrice = parseFloat(price);
        } else {
          myTrade.buyPrice = parseFloat(price);
        }
      }
    });
};

const websocketConnect = async ({
  host,
  port,
}) => {
  return new Promise(resolve => {
    let isOpened = false;
    let sendPongInterval;
    const client = new WebSocketClient(`ws://${host}:${port}`, {
      maxPayload: 2e+9,
    });

    client.on('open', () => {
      isOpened = true;

      sendPongInterval = setInterval(() => {
        client.send(JSON.stringify({ actionName: 'pong' }));
      }, 1 * 60 * 1000); // 1

      resolve(client);
    });

    client.on('close', () => {
      clearInterval(sendPongInterval);
      throw new Error('Connection was closed');
    });

    client.on('message', async bufferData => {
      const parsedData = JSON.parse(bufferData.toString());
      emitter.emit('tradesData', parsedData);
    });

    client.on('error', (error) => {
      console.log(error);
    });

    setTimeout(() => {
      if (!isOpened) {
        clearInterval(sendPongInterval);
        throw new Error('Cant open connection');
      }
    }, 10 * 1000); // 10 seconds
  });
};

const processedInstrumentsCounter = function (numberInstruments = 0) {
  let processedInstruments = 0;

  return function () {
    processedInstruments += 1;
    log.info(`${processedInstruments} / ${numberInstruments}`);
  };
};
