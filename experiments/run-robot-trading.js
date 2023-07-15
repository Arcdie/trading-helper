const fs = require('fs');
const moment = require('moment');
const { EMA } = require('technicalindicators');

const { getUnix } = require('../libs/support');

const Candle5m = require('../models/Candle-5m');
const InstrumentNew = require('../models/InstrumentNew');

const workAmount = 25;
const numberTrades = 4;

const LOSS_PERCENT_PER_DEPOSIT = 1;

module.exports = async () => {
  // return;
  const instrument = await getInstrument('ENJUSDTPERP');
  const originalCandles = upgradeCandes(JSON.parse(readCandles()));
  const report = [];

  const startDate = moment('2022-01-01T01:30:00.000Z');
  const startDateUnix = startDate.unix();
  const index = originalCandles.findIndex(c => c.originalTimeUnix === startDateUnix);

  let prevMaxLoss = 0;

  const candles = originalCandles.slice(0, index);

  const lOriginalCandles = originalCandles.length;
  console.log('lOriginalCandles', lOriginalCandles);

  for (let i = index; i < lOriginalCandles; i += 1) {
    if (i % 10000 === 0) {
      console.log('i', i);
    }

    const max = report.sort((a, b) => a[0] < b[0] ? 1 : -1)[0];

    if (max) {
      const [maxResultLoss, maxNumberSaveTradeHandlers, difference, timeUnix] = max;

      if (maxResultLoss !== prevMaxLoss) {
        prevMaxLoss = maxResultLoss;
        const days = parseInt(difference / 86400, 10);
        const hours = parseInt((difference % 86400) / 3600, 10);
        console.log(`l: ${maxResultLoss.toFixed(1)}`, `n: ${maxNumberSaveTradeHandlers}`, `d: ${days}`, `h: ${hours}, t: ${timeUnix}`);
      }
    }

    const currentCandle = originalCandles[i];
    candles.push(currentCandle);

    instrument.price = currentCandle.close;

    let averagePercent = calculateExpotentialAveragePercent(36, candles);
    const stopLossPercent = parseFloat((averagePercent * 2).toFixed(1));

    const transaction = createTransaction(instrument, candles[i], {
      isLong: true,
      stopLossPercent,
    });

    let saveTrade = false;
    let resultLoss = 0;
    let numberSaveTradeHandled = 0;

    let maxResultLoss = 0;
    let maxNumberSaveTradeHandlers = 0;

    const savePrice = (currentCandle.close / 100) * (transaction.stopLossPercent);
    const topSavePrice = currentCandle.close + savePrice;
    const bottomSavePrice = currentCandle.close - savePrice;

    for (let j = i + 1; j < lOriginalCandles; j += 1) {
      const candle = originalCandles[j];
      averagePercent = calculateExpotentialAveragePercent(36, originalCandles.slice(j - 40, j + 1));

      if (saveTrade) {
        if (saveTrade.isActive) {
          const sum = resultLoss / saveTrade.quantity;
          const saveTradeTakeProfitPrice = saveTrade.isLong ? saveTrade.tradePrice + sum : saveTrade.tradePrice - sum;

          if ((saveTrade.isLong && candle.low <= saveTrade.stopLossPrice)
            || (!saveTrade.isLong && candle.high >= saveTrade.stopLossPrice)) {
            // touch saveTrade stopLoss

            let isProfit = false;

            if (saveTrade.isLong) {
              if (saveTrade.stopLossPrice > saveTrade.tradePrice) {
                const profit = (saveTrade.stopLossPrice - saveTrade.tradePrice) * saveTrade.quantity;
                resultLoss -= profit;
                isProfit = true;
              } else {
                const loss = (saveTrade.tradePrice - saveTrade.stopLossPrice) * saveTrade.quantity;
                resultLoss += loss;
              }
            } else {
              if (saveTrade.stopLossPrice < saveTrade.tradePrice) {
                const profit = (saveTrade.tradePrice - saveTrade.stopLossPrice) * saveTrade.quantity;
                resultLoss -= profit;
                isProfit = true;
              } else {
                const loss = (saveTrade.stopLossPrice - saveTrade.tradePrice) * saveTrade.quantity;
                resultLoss += loss;
              }
            }

            numberSaveTradeHandled += 1;
            maxNumberSaveTradeHandlers += 1;

            if (resultLoss > maxResultLoss) {
              maxResultLoss = resultLoss;
            }

            const tmpSavePrice = (candle.close / 100) * (averagePercent * 2);

            saveTrade = {
              isActive: false,
              quantity: saveTrade.quantity,
              triggerPrices: [
                { isLong: true, price: saveTrade.stopLossPrice + (tmpSavePrice * 2) },
                { isLong: false, price: saveTrade.stopLossPrice - (tmpSavePrice * 2) },
              ],
            };

            if (!isProfit && numberSaveTradeHandled >= 10) {
              // saveTrade.quantity += (transaction.quantity / 2);
            }
          } else if ((saveTrade.isLong && candle.high >= saveTradeTakeProfitPrice)
            || (!saveTrade.isLong && candle.low <= saveTradeTakeProfitPrice)) {
            // touch saveTrade takeProfit
            resultLoss = 0;
            saveTrade = false;
            transaction.endedAtUnix = candle.originalTimeUnix;
          } else if ((saveTrade.isLong && candle.high >= saveTrade.triggerPrice)
            || (!saveTrade.isLong && candle.low <= saveTrade.triggerPrice)) {
            const tmpSavePrice = (candle.close / 100) * (averagePercent * 2);

            if (saveTrade.isLong) {
              saveTrade.stopLossPrice = saveTrade.triggerPrice - tmpSavePrice;
              saveTrade.triggerPrice += tmpSavePrice;
            } else {
              saveTrade.stopLossPrice = saveTrade.triggerPrice + tmpSavePrice;
              saveTrade.triggerPrice -= tmpSavePrice;
            }
          }
        } else {
          const isTriggered = saveTrade.triggerPrices.find(trigger =>
            (trigger.isLong && candle.high >= trigger.price) || (!trigger.isLong && candle.low <= trigger.price));

          if (isTriggered) {
            const tmpSavePrice = (candle.close / 100) * (averagePercent * 2);

            saveTrade.isActive = true;
            saveTrade.isLong = isTriggered.isLong;
            saveTrade.tradePrice = isTriggered.price;
            saveTrade.stopLossPrice = saveTrade.isLong ? saveTrade.tradePrice - tmpSavePrice : saveTrade.tradePrice + tmpSavePrice;
            saveTrade.triggerPrice = saveTrade.isLong ? saveTrade.tradePrice + (tmpSavePrice * 2) : saveTrade.tradePrice - (tmpSavePrice * 2);
          }
        }
      }

      if (transaction.isActive) {
        const limitStopLossPrice = transaction.isLong ? bottomSavePrice - (savePrice / 2) : topSavePrice + (savePrice / 2);

        // touch stopLoss
        if ((transaction.isLong && (candle.low <= limitStopLossPrice || candle.close <= bottomSavePrice))
          || (!transaction.isLong && (candle.high >= limitStopLossPrice || candle.close >= topSavePrice))) {
          const stopLossPrice = transaction.isLong ?
            candle.low <= limitStopLossPrice ? limitStopLossPrice : candle.close
            : candle.high >= limitStopLossPrice ? limitStopLossPrice : candle.close;

          const loss = ((transaction.isLong ? (currentCandle.close - stopLossPrice) : (stopLossPrice - currentCandle.close)) * transaction.quantity);
          resultLoss += loss;
          maxResultLoss += loss;

          if (transaction.isLong) {
            transaction.sellPrice = currentCandle.close;
          } else {
            transaction.buyPrice = currentCandle.close;
          }

          transaction.isActive = false;
          transaction.endedAtUnix = candle.originalTimeUnix;

          saveTrade = {
            isActive: true, // true == save mode, -50% to profit
            isLong: !transaction.isLong,
            quantity: transaction.quantity,
            tradePrice: stopLossPrice,
          };

          saveTrade.stopLossPrice = saveTrade.isLong ? saveTrade.tradePrice - savePrice : saveTrade.tradePrice + savePrice;
          saveTrade.triggerPrice = saveTrade.isLong ? saveTrade.tradePrice + (savePrice * 2) : saveTrade.tradePrice - (savePrice * 2);
        } else {
          // touch takeProfit
          const { takeProfitPrice } = transaction;

          if ((transaction.isLong && candle.high >= takeProfitPrice)
            || (!transaction.isLong && candle.low <= takeProfitPrice)) {
            if (transaction.isLong) {
              transaction.sellPrice = transaction.takeProfitPrice;
            } else {
              transaction.buyPrice = transaction.takeProfitPrice;
            }

            transaction.isActive = false;
            transaction.endedAtUnix = candle.originalTimeUnix;

            saveTrade = false;
          }
        }
      }

      if (!transaction.isActive && !saveTrade) {
        const difference = candle.originalTimeUnix - currentCandle.originalTimeUnix;

        /*
        const days = parseInt(difference / 86400, 10);
        const hours = parseInt((difference % 86400) / 3600, 10);

        console.log(`d: ${days}`, `h: ${hours}`, `n: ${maxNumberSaveTradeHandlers}`, `l: ${maxResultLoss.toFixed(1)}`);
        */
        report.push([maxResultLoss, maxNumberSaveTradeHandlers, difference, currentCandle.originalTimeUnix]);

        break;
      }
    }

    if (saveTrade || transaction.isActive) {
      console.log('No result', `n: ${maxNumberSaveTradeHandlers}`, `l: ${maxResultLoss.toFixed(1)}, t: ${currentCandle.originalTimeUnix}`);
    }
  }

  report
    .sort((a, b) => a[0] < b[0] ? 1 : -1)
    .forEach(e => {
      const [maxResultLoss, maxNumberSaveTradeHandlers, difference] = e;

      const days = parseInt(difference / 86400, 10);
      const hours = parseInt((difference % 86400) / 3600, 10);
      console.log(`l: ${maxResultLoss.toFixed(1)}`, `n: ${maxNumberSaveTradeHandlers}`, `d: ${days}`, `h: ${hours}`);
    });

  console.log('finished');
};

const createTransaction = (instrument, candle, {
  isLong,
  stopLossPercent,
}) => {
  const newTransaction = {
    instrumentId: instrument._id,

    isLong,
    isActive: true,

    quantity: 0,
    stopLossPrice: 0,
    stopLossPercent: 0,
    takeProfitPrice: 0,

    buyPrice: 0,
    sellPrice: 0,

    startedAtUnix: getUnix(candle.time),
    endedAtUnix: false,
  };

  if (newTransaction.isLong) {
    newTransaction.buyPrice = instrument.price;
  } else {
    newTransaction.sellPrice = instrument.price;
  }

  const stepSize = instrument.step_size;
  const stepSizePrecision = getPrecision(stepSize);
  const tickSizePrecision = getPrecision(instrument.tick_size);

  const sumTransaction = workAmount * numberTrades;
  const allowedSumLoss = sumTransaction * (LOSS_PERCENT_PER_DEPOSIT / 100);

  let quantity = workAmount / instrument.price;

  const stopLossPrice = parseFloat(calculateStopLossPrice({
    stopLossPercent,
    isLong: newTransaction.isLong,
    instrumentPrice: instrument.price,
  }).toFixed(tickSizePrecision));

  const profit = Math.abs(((stopLossPrice - instrument.price) * quantity));
  const coefficient = profit / allowedSumLoss;

  if (coefficient >= 0) {
    if (coefficient > 0) {
      quantity /= coefficient;
    }
  } else {
    throw new Error(`coefficient = ${coefficient}`);
  }

  let quantityForOneTrade = quantity / numberTrades;

  if (quantityForOneTrade < stepSize) {
    throw new Error('quantity < stepSize (1)');
  }

  const remainder = quantityForOneTrade % stepSize;

  if (remainder !== 0) {
    quantityForOneTrade -= remainder;

    if (quantityForOneTrade < stepSize) {
      throw new Error('quantity < stepSize (2)');
    }

    quantity -= (remainder * numberTrades);
  }

  quantity = parseFloat((quantity).toFixed(stepSizePrecision));

  if (quantity < stepSize) {
    throw new Error('quantity < stepSize (3)');
  }

  newTransaction.stopLossPrice = stopLossPrice;
  newTransaction.stopLossPercent = stopLossPercent;
  newTransaction.quantity = parseFloat((quantity).toFixed(stepSizePrecision));
  newTransaction.takeProfitPrice = calculateTakeProfitForTrade(newTransaction, {
    tickSizePrecision,
    instrumentPrice: instrument.price,
  });

  return newTransaction;
};

const calculateExpotentialAveragePercent = (period, candles) => {
  const targetCandlesPeriod = candles.slice(-period);

  return EMA.calculate({
    period,
    values: targetCandlesPeriod.map(candle => {
      const difference = Math.abs(candle.high - candle.low);
      return 100 / (candle.open / difference);
    }),
  })[0];
}

const upgradeCandes = (rawCandles) => {
  return rawCandles
    .map(candle => {
      const timeUnix = getUnix(candle.time);

      return {
        originalTime: candle.time,
        originalTimeUnix: timeUnix,
        time: timeUnix,
        open: candle.data[0],
        close: candle.data[1],
        low: candle.data[2],
        high: candle.data[3],
        volume: candle.volume,

        isLong: candle.data[1] > candle.data[0],
      };
    })
    .sort((a, b) => {
      return a.originalTimeUnix < b.originalTimeUnix ? -1 : 1;
    });
};

const calculateTakeProfitForTrade = (transaction, {
  instrumentPrice,
  tickSizePrecision,
}) => {
  const takeProfitPercent = transaction.stopLossPercent;
  const sumProfit = (transaction.stopLossPrice / 100) * takeProfitPercent;

  const takeProfitPrice = transaction.isLong
    ? instrumentPrice + (sumProfit * 1) : instrumentPrice - (sumProfit * 1);
  return parseFloat((takeProfitPrice).toFixed(tickSizePrecision));
};

const calculateStopLossPrice = ({ instrumentPrice, stopLossPercent, isLong }) => {
  const percentPerPrice = instrumentPrice * (stopLossPercent / 100);
  return isLong ? instrumentPrice - percentPerPrice : instrumentPrice + percentPerPrice;
};

const getPrecision = (price) => {
  const dividedPrice = price.toString().split('.');
  return !dividedPrice[1] ? 0 : dividedPrice[1].length;
};

const getInstrument = (name) => InstrumentNew.findOne({ name, is_futures: true }).exec();

const readCandles = () => {
  const fileName = `${__dirname}/candles.json`;
  return fs.readFileSync(fileName, 'utf-8');
};

const getCandles = (instrumentId) => {
  const startOfCurrentYear = moment().startOf('year');
  const startOf22Year = moment().startOf('year').add(-1, 'year');

  return Candle5m.find({
    instrument_id: instrumentId,
    $and: [{
      time: {
        $gte: startOf22Year.toISOString(),
      },
    }, {
      time: {
        $lte: startOfCurrentYear.toISOString(),
      },
    }],
  }).exec();
};

/*
  const rawCandles = await getCandles(instrument._id);

  fs.writeFileSync(`${__dirname}/candles.json`, JSON.stringify(rawCandles.map(c => ({
    data: c.data,
    volume: c.volume,
    time: c.time,
  }))));

  return false;
  // */
