const moment = require('moment');

const {
  getUnix,
} = require('../libs/support');

const {
  create1hCandle,
} = require('../controllers/candles/utils/create-1h-candle');

const {
  create4hCandle,
} = require('../controllers/candles/utils/create-4h-candle');

const {
  create1dCandle,
} = require('../controllers/candles/utils/create-1d-candle');

const log = require('../libs/logger');

const Candle5m = require('../models/Candle-5m');
const InstrumentNew = require('../models/InstrumentNew');

module.exports = async () => {
  return;
  console.time('migration');
  console.log('Migration started');

  const instrumentsDocs = await InstrumentNew.find({
    is_active: true,
    // is_futures: true,
  }).exec();

  if (!instrumentsDocs || !instrumentsDocs.length) {
    console.timeEnd('migration');
    return true;
  }

  let processedInstruments = 0;
  const totalInstruments = instrumentsDocs.length;

  const checkInterval = setInterval(() => {
    log.info(`${processedInstruments} / ${totalInstruments}`);
  }, 10 * 1000);

  const startDate = moment('2021-11-01 00:00:00.000Z').utc();
  const endDate = moment('2021-12-05 15:00:00.000Z').utc();

  for (const instrumentDoc of instrumentsDocs) {
    const allCandlesDocs = await Candle5m.find({
      instrument_id: instrumentDoc._id,

      $and: [{
        time: { $gte: startDate },
      }, {
        time: { $lt: endDate },
      }],
    }).sort({ time: 1 }).exec();

    if (!allCandlesDocs || !allCandlesDocs.length) {
      continue;
    }

    let candlesDocs = [];
    const lAllCandles = allCandlesDocs.length;
    const firstCandleUnix = getUnix(allCandlesDocs[0].time);

    if ((firstCandleUnix % 86400) !== 0) {
      let candleWithValidTimeIndex = false;
      for (let i = 0; i < lAllCandles; i += 1) {
        const candle = allCandlesDocs[i];
        const candleUnix = getUnix(candle.time);
        if ((candleUnix % 86400) === 0) {
          candleWithValidTimeIndex = i;
          break;
        }
      }
      if (candleWithValidTimeIndex) {
        candlesDocs = allCandlesDocs.slice(candleWithValidTimeIndex, lAllCandles - 1);
      }
    } else {
      candlesDocs = allCandlesDocs;
    }

    const preparedCandles = candlesDocs.map(candle => ({
      open: candle.data[0],
      close: candle.data[1],
      low: candle.data[2],
      high: candle.data[3],
      volume: candle.volume,
      time: candle.time,
    }));

    // const oneHourCandles = [];
    const oneHourCandles = calculateOneHourTimeFrameData(preparedCandles);

    await Promise.all(oneHourCandles.map(async candle => {
      const resultCreateCandle = await create1hCandle({
        instrumentId: instrumentDoc._id,
        startTime: candle.time,
        open: candle.open,
        close: candle.close,
        high: candle.high,
        low: candle.low,
        volume: candle.volume,
      });

      if (!resultCreateCandle || !resultCreateCandle.status) {
        log.warn(resultCreateCandle.message || 'Cant create1hCandle');
        return null;
      }
    }));

    // const fourHourCandles = [];
    const fourHourCandles = calculateFourHoursTimeFrameData(preparedCandles);

    await Promise.all(fourHourCandles.map(async candle => {
      const resultCreateCandle = await create4hCandle({
        instrumentId: instrumentDoc._id,
        startTime: candle.time,
        open: candle.open,
        close: candle.close,
        high: candle.high,
        low: candle.low,
        volume: candle.volume,
      });

      if (!resultCreateCandle || !resultCreateCandle.status) {
        log.warn(resultCreateCandle.message || 'Cant create4hCandle');
        return null;
      }
    }));

    // const dayCandles = [];
    const dayCandles = calculateDayTimeFrameData(preparedCandles);

    await Promise.all(dayCandles.map(async candle => {
      const resultCreateCandle = await create1dCandle({
        instrumentId: instrumentDoc._id,
        startTime: candle.time,
        open: candle.open,
        close: candle.close,
        high: candle.high,
        low: candle.low,
        volume: candle.volume,
      });

      if (!resultCreateCandle || !resultCreateCandle.status) {
        log.warn(resultCreateCandle.message || 'Cant create1dCandle');
        return null;
      }
    }));

    processedInstruments += 1;
    console.log(`Ended ${instrumentDoc.name}`);
  }

  clearInterval(checkInterval);
  console.timeEnd('migration');
};

const calculateOneHourTimeFrameData = (candles) => {
  const breakdownByDay = [];
  const breakdownByHour = [];

  let insertArr = [];
  let currentDay = new Date(candles[0].time).getUTCDate();

  candles.forEach(candle => {
    const candleDay = new Date(candle.time).getUTCDate();

    if (candleDay !== currentDay) {
      breakdownByDay.push(insertArr);
      insertArr = [];
      currentDay = candleDay;
    }

    insertArr.push(candle);
  });

  breakdownByDay.push(insertArr);
  insertArr = [];

  breakdownByDay.forEach(dayCandles => {
    let currentHourUnix = getUnix(dayCandles[0].time);
    let nextCurrentHourUnix = currentHourUnix + 3600;

    dayCandles.forEach(candle => {
      if (getUnix(candle.time) >= nextCurrentHourUnix) {
        breakdownByHour.push(insertArr);
        insertArr = [];
        currentHourUnix = nextCurrentHourUnix;
        nextCurrentHourUnix += 3600;
      }

      insertArr.push(candle);
    });

    breakdownByHour.push(insertArr);
    insertArr = [];
  });

  const returnData = [];

  breakdownByHour.forEach(hourCandles => {
    const arrLength = hourCandles.length;

    const open = hourCandles[0].open;
    const close = hourCandles[arrLength - 1].close;
    const candleDate = hourCandles[0].time;

    let sumVolume = 0;
    let minLow = hourCandles[0].low;
    let maxHigh = hourCandles[0].high;

    hourCandles.forEach(candle => {
      if (candle.high > maxHigh) {
        maxHigh = candle.high;
      }

      if (candle.low < minLow) {
        minLow = candle.low;
      }

      sumVolume += candle.volume;
    });

    returnData.push({
      open,
      close,
      high: maxHigh,
      low: minLow,
      volume: parseInt(sumVolume, 10),
      time: moment(candleDate).utc().startOf('hour'),
    });
  });

  return returnData;
};

const calculateFourHoursTimeFrameData = (candles) => {
  const breakdownByDay = [];
  const breakdownByHour = [];

  let insertArr = [];
  let currentDay = new Date(candles[0].time).getUTCDate();

  candles.forEach(candle => {
    const candleDay = new Date(candle.time).getUTCDate();

    if (candleDay !== currentDay) {
      breakdownByDay.push(insertArr);
      insertArr = [];
      currentDay = candleDay;
    }

    insertArr.push(candle);
  });

  breakdownByDay.push(insertArr);
  insertArr = [];

  breakdownByDay.forEach(dayCandles => {
    let currentHourUnix = getUnix(dayCandles[0].time);
    let nextCurrentHourUnix = currentHourUnix + (3600 * 4);

    dayCandles.forEach(candle => {
      if (getUnix(candle.time) >= nextCurrentHourUnix) {
        breakdownByHour.push(insertArr);
        insertArr = [];
        currentHourUnix = nextCurrentHourUnix;
        nextCurrentHourUnix += (3600 * 4);
      }

      insertArr.push(candle);
    });

    breakdownByHour.push(insertArr);
    insertArr = [];
  });

  const returnData = [];

  breakdownByHour.forEach(hourCandles => {
    const arrLength = hourCandles.length;

    const open = hourCandles[0].open;
    const close = hourCandles[arrLength - 1].close;
    const candleDate = hourCandles[0].time;

    let sumVolume = 0;
    let minLow = hourCandles[0].low;
    let maxHigh = hourCandles[0].high;

    hourCandles.forEach(candle => {
      if (candle.high > maxHigh) {
        maxHigh = candle.high;
      }

      if (candle.low < minLow) {
        minLow = candle.low;
      }

      sumVolume += candle.volume;
    });

    returnData.push({
      open,
      close,
      high: maxHigh,
      low: minLow,
      volume: parseInt(sumVolume, 10),
      time: moment(candleDate).utc().startOf('hour'),
    });
  });

  return returnData;
};

const calculateDayTimeFrameData = (candles) => {
  const breakdownByDay = [];

  let insertArr = [];
  let currentDay = new Date(candles[0].time).getUTCDate();

  candles.forEach(candle => {
    const candleDay = new Date(candle.time).getUTCDate();

    if (candleDay !== currentDay) {
      breakdownByDay.push(insertArr);
      insertArr = [];
      currentDay = candleDay;
    }

    insertArr.push(candle);
  });

  breakdownByDay.push(insertArr);

  const returnData = [];

  breakdownByDay.forEach(dayCandles => {
    const arrLength = dayCandles.length;

    const open = dayCandles[0].open;
    const close = dayCandles[arrLength - 1].close;
    const candleDate = dayCandles[0].time;

    let sumVolume = 0;
    let minLow = dayCandles[0].low;
    let maxHigh = dayCandles[0].high;

    dayCandles.forEach(candle => {
      if (candle.high > maxHigh) {
        maxHigh = candle.high;
      }

      if (candle.low < minLow) {
        minLow = candle.low;
      }

      sumVolume += candle.volume;
    });

    returnData.push({
      open,
      close,
      high: maxHigh,
      low: minLow,
      volume: parseInt(sumVolume, 10),
      time: moment(candleDate).utc().startOf('day'),
    });
  });

  return returnData;
};
