const moment = require('moment');
const ATR = require('technicalindicators').ATR;

const log = require('../libs/logger')(module);

const {
  getUnix,
  getPrecision,
} = require('../libs/support');

const {
  getActiveInstruments,
} = require('../controllers/instruments/utils/get-active-instruments');

const {
  createUserTradeBoundForStatistics,
} = require('../controllers/user-trade-bounds/utils/create-user-trade-bound-for-statistics');

const {
  TYPES_EXIT,
  TYPES_TRADES,
} = require('../controllers/user-trade-bounds/constants');

const Candle1h = require('../models/Candle-1h');

const WORK_AMOUNT = 10;
const TYPE_TRADE = TYPES_TRADES.get('TREND_TRADING');

module.exports = async () => {
  try {
    return;
    console.time('experiment');
    console.log('Experiment started');

    const settings = {
      stopLossPercent: 2,
    };

    const resultGetInstruments = await getActiveInstruments({
      isOnlyFutures: true,
    });

    if (!resultGetInstruments || !resultGetInstruments.status) {
      log.warn(resultGetInstruments.message || 'Cant getActiveInstruments');
      return false;
    }

    let instrumentsDocs = (resultGetInstruments.result || []);
      // .filter(d => ['IOTXUSDTPERP', 'BTCUSDTPERP'].includes(d.name));

    // instrumentsDocs = instrumentsDocs.slice(22 + 30 + 29, instrumentsDocs.length);

    if (!instrumentsDocs.length) {
      log.warn('No active instruments');
      return false;
    }

    const btcDoc = instrumentsDocs.find(doc => doc.name === 'BTCUSDTPERP');

    if (!btcDoc) {
      log.warn('No btcDoc');
      return false;
    }

    // 1 december 2021 - 1 january 2022
    const startDate = moment.unix(1638316800).utc();
    const endDate = moment.unix(1640995200).utc();

    // 1 november 2021 - 1 december 2022
    // const startDate = moment.unix(1635724800).utc();
    // const endDate = moment.unix(1638316800).utc();

    // 1 october - 1 november
    // const startDate = moment.unix(1633046400).utc();
    // const endDate = moment.unix(1635724800).utc();

    // 1 october - 1 january
    // const startDate = moment.unix(1633046400).utc();
    // const endDate = moment.unix(1640995200).utc();

    const incrementProcessedInstruments = processedInstrumentsCounter(instrumentsDocs.length);

    const instrumentsIds = instrumentsDocs.map(doc => doc._id);

    let candlesDocs = await Candle1h
      .find({
        instrument_id: { $in: instrumentsIds },

        $and: [{
          time: {
            $gte: startDate,
          },
        }, {
          time: {
            $lt: endDate,
          },
        }],
      }, {
        instrument_id: 1,
        data: 1,
        time: 1,
      })
      .sort({ time: -1 })
      .exec();

    if (!candlesDocs.length) {
      log.warn('No candles');
      return false;
    }

    const newTrades = [];

    const btcCandlesOriginalData = prepareNewData(
      candlesDocs.filter(doc => doc.instrument_id.toString() === btcDoc._id.toString()),
    );

    for await (const instrumentDoc of instrumentsDocs) {
      if (instrumentDoc._id.toString() === btcDoc._id.toString()) {
        continue;
      }

      const candlesOriginalData = prepareNewData(
        candlesDocs.filter(doc => doc.instrument_id.toString() === instrumentDoc._id.toString()),
      );

      if (!candlesOriginalData || !candlesOriginalData.length) {
        log.warn(`No candles for ${instrumentDoc._id}`);
        continue;
      }

      candlesDocs = candlesDocs.filter(
        candleDoc => candleDoc.instrument_id.toString() !== instrumentDoc._id.toString(),
      );

      instrumentDoc.my_trades = [];

      calculateTrades(
        instrumentDoc, {
          candlesOriginalData,
          btcCandlesOriginalData,
          // candlesUpperTimeframeOriginalData: prepareNewData(resultGetCandlesUpperTimeframe.result),
        }, settings,
      );

      newTrades.push(
        ...instrumentDoc.my_trades.map(myTrade => ({
          ...myTrade,
          instrumentId: instrumentDoc._id,
        })),
      );

      incrementProcessedInstruments();
      log.info(`Ended ${instrumentDoc.name}`);
    }

    await Promise.all(newTrades.map(async myTrade => {
      const resultCreateBound = await createUserTradeBoundForStatistics({
        ...myTrade,
        typeTrade: TYPE_TRADE,
        typeExit: TYPES_EXIT.get('DEACTIVATED'),
      });

      if (!resultCreateBound || !resultCreateBound.status) {
        const message = resultCreateBound.message || 'Cant createUserTradeBoundForStatistics';

        log.warn(message);
        return null;
      }
    }));

    console.timeEnd('experiment');
  } catch (error) {
    console.log(error);
  }
};

const calculateTrades = (instrumentDoc, {
  candlesOriginalData,
  btcCandlesOriginalData,
  candlesUpperTimeframeOriginalData,
}, settings) => {
  if (!candlesOriginalData.length) {
    return false;
  }

  const lOriginalCandles = candlesOriginalData.length;

  const candlesData = [];
  let microTrendData = [];
  let macroTrendData = [];

  let microTrendDataBtc = [];
  let macroTrendDataBtc = [];

  let microTrendDataUpperTimerame = [];
  let macroTrendDataUpperTimeframe = [];

  if (btcCandlesOriginalData && btcCandlesOriginalData.length) {
    microTrendDataBtc = calculateTrendData(btcCandlesOriginalData, {
      atrPeriod: 10,
      factor: 3,
    });

    macroTrendDataBtc = calculateTrendData(btcCandlesOriginalData, {
      atrPeriod: 20,
      factor: 5,
    });
  }

  if (candlesUpperTimeframeOriginalData && candlesUpperTimeframeOriginalData.length) {
    microTrendDataUpperTimerame = calculateTrendData(candlesUpperTimeframeOriginalData, {
      atrPeriod: 10,
      factor: 3,
    });

    macroTrendDataUpperTimeframe = calculateTrendData(candlesUpperTimeframeOriginalData, {
      atrPeriod: 20,
      factor: 5,
    });
  }

  for (let i = 0; i < lOriginalCandles; i += 1) {
    const currentCandle = candlesOriginalData[i];

    checkMyTrades(instrumentDoc, currentCandle, {
      microTrendData,
      macroTrendData,
    });

    const resultLong = strategyFunctionLong({
      candlesData,
      microTrendData,
      macroTrendData,

      microTrendDataBtc,
      macroTrendDataBtc,
      microTrendDataUpperTimerame,
      macroTrendDataUpperTimeframe,
    }, {
      ...currentCandle,
      isClosed: true,
    }, settings);

    const resultShort = strategyFunctionShort({
      candlesData,
      microTrendData,
      macroTrendData,

      microTrendDataBtc,
      macroTrendDataBtc,
      microTrendDataUpperTimerame,
      macroTrendDataUpperTimeframe,
    }, {
      ...currentCandle,
      isClosed: true,
    }, settings);

    if (resultLong) {
      const stopLossPercent = settings.stopLossPercent / 100;
      const percentPerPrice = (resultLong.close * stopLossPercent);

      const stopLossPrice = resultLong.isLong ?
        (currentCandle.close - percentPerPrice) : (currentCandle.close + percentPerPrice);

      createMyTrade(instrumentDoc, {
        isLong: resultLong.isLong,

        buyPrice: resultLong.isLong ? currentCandle.close : 0,
        sellPrice: !resultLong.isLong ? currentCandle.close : 0,

        stopLossPrice,
        // stopLossPrice: resultLong.isLong ? currentCandle.low : currentCandle.high,

        // stopLossPercent: settings.stopLossPercent,
        // takeProfitPercent: settings.stopLossPercent,

        tradeStartedAt: currentCandle.originalTimeUnix,
      });
    }

    if (resultShort) {
      const stopLossPercent = settings.stopLossPercent / 100;
      const percentPerPrice = (resultShort.close * stopLossPercent);

      const stopLossPrice = resultShort.isLong ?
        (currentCandle.close - percentPerPrice) : (currentCandle.close + percentPerPrice);

      createMyTrade(instrumentDoc, {
        isLong: resultShort.isLong,

        buyPrice: resultShort.isLong ? currentCandle.close : 0,
        sellPrice: !resultShort.isLong ? currentCandle.close : 0,

        stopLossPrice,
        // stopLossPrice: resultShort.isLong ? currentCandle.low : currentCandle.high,

        // stopLossPercent: settings.stopLossPercent,
        // takeProfitPercent: settings.stopLossPercent,

        tradeStartedAt: currentCandle.originalTimeUnix,
      });
    }

    candlesData.push(currentCandle);

    microTrendData = calculateTrendData(candlesData, {
      atrPeriod: 10,
      factor: 3,
    });

    macroTrendData = calculateTrendData(candlesData, {
      atrPeriod: 20,
      factor: 5,
    });
  }

  const lastCandle = candlesData[candlesData.length - 1];

  checkMyTrades(instrumentDoc, lastCandle, {
    microTrendData,
    macroTrendData,
  }, true);
};

const strategyFunctionLong = ({
  candlesData,
  microTrendData,
  macroTrendData,

  microTrendDataBtc,
  macroTrendDataBtc,

  microTrendDataUpperTimerame,
  macroTrendDataUpperTimeframe,
}, currentCandle, settings) => {
  if (!currentCandle.isClosed) {
    return false;
  }

  const lCandlesData = candlesData.length;
  const lMicroTrendData = microTrendData.length;
  const lMacroTrendData = macroTrendData.length;

  // if (!lCandlesData || !lMicroTrendData || !lMacroTrendData) {
  //   return false;
  // }

  if (lCandlesData < (20 * 2) || !lMicroTrendData || !lMacroTrendData) {
    return false;
  }

  const isLongCurrentCandle = currentCandle.close > currentCandle.open;

  if (!isLongCurrentCandle) {
    return false;
  }

  const lastMicroTrendData = microTrendData[lMicroTrendData - 1];
  const lastMacroTrendData = macroTrendData[lMacroTrendData - 1];

  // if (lastMicroTrendData.isLong) {
  //   return false;
  // }

  if (lastMacroTrendData.isLong) {
    return false;
  }

  // if (!lastMacroTrendData.isLong
  //   || lastMicroTrendData.isLong) {
  //   return false;
  // }

  if (currentCandle.close < lastMacroTrendData.superTrend) {
    return false;
  }

  const indexOfBtcCandle = microTrendDataBtc.findIndex(
    data => data.originalTimeUnix === lastMacroTrendData.originalTimeUnix,
  );

  if (microTrendDataBtc[indexOfBtcCandle].isLong
    || macroTrendDataBtc[indexOfBtcCandle].isLong) {
    return false;
  }

  return {
    ...currentCandle,
    isLong: true,
  };
};

const strategyFunctionShort = ({
  candlesData,
  microTrendData,
  macroTrendData,

  microTrendDataBtc,
  macroTrendDataBtc,

  microTrendDataUpperTimerame,
  macroTrendDataUpperTimeframe,
}, currentCandle, settings) => {
  if (!currentCandle.isClosed) {
    return false;
  }

  const lCandlesData = candlesData.length;
  const lMicroTrendData = microTrendData.length;
  const lMacroTrendData = macroTrendData.length;

  // if (!lCandlesData || !lMicroTrendData || !lMacroTrendData) {
  //   return false;
  // }

  if (lCandlesData < (20 * 2) || !lMicroTrendData || !lMacroTrendData) {
    return false;
  }

  const isLongCurrentCandle = currentCandle.close > currentCandle.open;

  if (isLongCurrentCandle) {
    return false;
  }

  const lastMicroTrendData = microTrendData[lMicroTrendData - 1];
  const lastMacroTrendData = macroTrendData[lMacroTrendData - 1];

  // if (lastMicroTrendData.isLong) {
  //   return false;
  // }

  if (!lastMacroTrendData.isLong) {
    return false;
  }

  // if (!lastMacroTrendData.isLong
  //   || lastMicroTrendData.isLong) {
  //   return false;
  // }

  if (currentCandle.close > lastMacroTrendData.superTrend) {
    return false;
  }

  const indexOfBtcCandle = microTrendDataBtc.findIndex(
    data => data.originalTimeUnix === lastMacroTrendData.originalTimeUnix,
  );

  if (!microTrendDataBtc[indexOfBtcCandle].isLong
    || !macroTrendDataBtc[indexOfBtcCandle].isLong) {
    return false;
  }

  return {
    ...currentCandle,
    isLong: false,
  };
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

  if (!options.stopLossPrice) {
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

    options.profitStepSize = profitStepSize;
    options.takeProfitPrice = parseFloat(options.takeProfitPrice.toFixed(instrumentDoc.price_precision));
  } else {
    // ...
  }

  options.isActive = true;
  options.quantity = quantity;
  options.index = instrumentDoc.my_trades.length;
  options.stopLossPrice = parseFloat(options.stopLossPrice.toFixed(instrumentDoc.price_precision));

  instrumentDoc.my_trades.push(options);
};

const checkMyTrades = (instrumentDoc, currentCandle, {
  microTrendData,
  macroTrendData,
}, isFinish = false) => {
  if (!instrumentDoc.my_trades || !instrumentDoc.my_trades.length) {
    return true;
  }

  const { superTrend } = microTrendData[microTrendData.length - 1];

  instrumentDoc.my_trades
    .filter(myTrade => myTrade.isActive)
    .forEach(myTrade => {
      if (!myTrade.takeProfitPercent) {
        if ((myTrade.isLong && superTrend > myTrade.stopLossPrice)
          || (!myTrade.isLong && superTrend < myTrade.stopLossPrice)) {
          myTrade.stopLossPrice = superTrend;
        }
      }

      if (isFinish
        || (myTrade.isLong && currentCandle.low < myTrade.stopLossPrice)
        || (!myTrade.isLong && currentCandle.high > myTrade.stopLossPrice)) {
        myTrade.isActive = false;
        myTrade.tradeEndedAt = currentCandle.originalTimeUnix;

        if (myTrade.isLong) {
          myTrade.sellPrice = myTrade.stopLossPrice;
        } else {
          myTrade.buyPrice = myTrade.stopLossPrice;
        }
      }
    });
};

const calculateTrendData = (inputData, settings) => {
  const workingData = JSON.parse(JSON.stringify(inputData));

  const dataForCalculate = {
    high: [],
    low: [],
    close: [],
    period: settings.atrPeriod,
  };

  workingData.forEach(data => {
    dataForCalculate.low.push(data.low);
    dataForCalculate.high.push(data.high);
    dataForCalculate.close.push(data.close);
  });

  const arrAtr = ATR.calculate(dataForCalculate);

  workingData.forEach((data, index) => {
    if (index < settings.atrPeriod) {
      return true;
    }

    const hl2 = (data.high + data.low) / 2;
    const prevData = workingData[index - 1];
    const atr = arrAtr[index - settings.atrPeriod];

    let topBand = hl2 + (settings.factor * atr);
    let bottomBand = hl2 - (settings.factor * atr);

    const prevAtr = prevData.atr;
    const prevClose = prevData.close;
    const prevTopBand = prevData.topBand || 0;
    const prevBottomBand = prevData.bottomBand || 0;
    const prevSuperTrend = prevData.superTrend || 0;

    topBand = (topBand < prevTopBand || prevClose > prevTopBand) ? topBand : prevTopBand;
    bottomBand = (bottomBand > prevBottomBand || prevClose < prevBottomBand) ? bottomBand : prevBottomBand;

    let direction = 0;
    let superTrend = 0;

    if (!prevAtr || Number.isNaN(prevAtr)) {
      direction = 1;
    } else if (prevSuperTrend === prevTopBand) {
      direction = data.close > topBand ? -1 : 1;
    } else {
      direction = data.close < bottomBand ? 1 : -1;
    }

    superTrend = direction === -1 ? bottomBand : topBand;

    data.atr = atr;
    data.topBand = topBand;
    data.bottomBand = bottomBand;
    data.superTrend = superTrend;
    data.isLong = direction < 0;
  });

  return workingData;
};

const prepareNewData = (instrumentData) => {
  const validData = instrumentData
    .map(data => {
      const timeUnix = getUnix(data.time);

      return {
        originalTime: data.time,
        originalTimeUnix: timeUnix,
        time: timeUnix,

        open: data.data[0],
        close: data.data[1],
        low: data.data[2],
        high: data.data[3],
        volume: data.volume,

        isLong: data.data[1] > data.data[0],
      };
    })
    .sort((a, b) => {
      if (a.originalTimeUnix < b.originalTimeUnix) {
        return -1;
      }

      return 1;
    });

  return validData;
};

const processedInstrumentsCounter = function (numberInstruments = 0) {
  let processedInstruments = 0;

  return function () {
    processedInstruments += 1;
    log.info(`${processedInstruments} / ${numberInstruments}`);
  };
};
