const moment = require('moment');

const {
  isMongoId,
} = require('validator');

const log = require('../../libs/logger');

const {
  getUnix,
} = require('../../libs/support');

const {
  getCandles,
} = require('../candles/utils/get-candles');

const {
  getActiveInstruments,
} = require('../instruments/utils/get-active-instruments');

const {
  createUserLevelBound,
} = require('./utils/create-user-level-bound');

const {
  DEFAULT_INDENT_IN_PERCENTS,
} = require('./constants');

const Candle = require('../../models/Candle');
const InstrumentNew = require('../../models/InstrumentNew');
const UserLevelBound = require('../../models/UserLevelBound');

module.exports = async (req, res, next) => {
  const {
    body: {
      userId,
    },

    user,
  } = req;

  if (!user) {
    return res.json({
      status: false,
      message: 'Not authorized',
    });
  }

  if (!userId || !isMongoId(userId)) {
    return res.json({
      status: false,
      message: 'No or invalid userId',
    });
  }

  if (userId !== user._id.toString()) {
    return res.json({
      status: false,
      message: 'userIds are not equal',
    });
  }

  const resultGetInstruments = await getActiveInstruments({
    isOnlyFutures: true,
  });

  if (!resultGetInstruments || !resultGetInstruments.status) {
    return res.json({
      status: false,
      message: resultGetInstruments.message || 'Cant getActiveInstruments',
    });
  }

  const instrumentsDocs = resultGetInstruments.result;

  if (!instrumentsDocs || !instrumentsDocs.length) {
    return {
      status: true,
      result: [],
    };
  }

  const result = [];

  await UserLevelBound.deleteMany({
    user_id: userId,
  });

  for (const instrumentDoc of instrumentsDocs) {
    const resultGetCandles = await getCandles({
      instrumentId: instrumentDoc._id,
    });

    if (!resultGetCandles || !resultGetCandles.status) {
      log.warn(resultGetCandles.message || 'Cant getCandles');
      continue;
    }

    const newLevels = [];
    const candles = resultGetCandles.result;

    candles.forEach(candle => {
      candle.timeUnix = getUnix(candle.time);

      candle.open = candle.data[0];
      candle.close = candle.data[1];
      candle.low = candle.data[2];
      candle.high = candle.data[3];
    });

    if (!user.levels_monitoring_settings) {
      user.levels_monitoring_settings = {};
    }

    const {
      is_draw_levels_for_1h_candles: isDrawLevelsFor1hCandles,
      is_draw_levels_for_4h_candles: isDrawLevelsFor4hCandles,
      is_draw_levels_for_day_candles: isDrawLevelsForDayCandles,
    } = user.levels_monitoring_settings;

    if (isDrawLevelsForDayCandles) {
      const {
        number_candles_for_calculate_day_levels: numberCandlesForCalculateDayLevels,
      } = user.levels_monitoring_settings;

      const dayCandles = calculateDayTimeFrameData(candles);
      const highLevels = findHighLevels(dayCandles, numberCandlesForCalculateDayLevels);
      const lowLevels = findLowLevels(dayCandles, numberCandlesForCalculateDayLevels);

      [...highLevels, ...lowLevels].forEach(level => {
        const levelsWithThisPrice = newLevels.some(
          newLevel => newLevel.levelPrice === level.levelPrice,
        );

        if (!levelsWithThisPrice) {
          newLevels.push({
            levelTimeframe: 'day',
            levelPrice: level.levelPrice,
            levelStartCandleTime: level.levelStartCandleTime,
          });
        }
      });
    }

    if (isDrawLevelsFor4hCandles) {
      const {
        is_draw_levels_for_4h_candles: numberCandlesForCalculate4hLevels,
      } = user.levels_monitoring_settings;

      const fourHoursCandles = calculateFourHoursTimeFrameData(candles);
      const highLevels = findHighLevels(fourHoursCandles, numberCandlesForCalculate4hLevels);
      const lowLevels = findLowLevels(fourHoursCandles, numberCandlesForCalculate4hLevels);

      [...highLevels, ...lowLevels].forEach(level => {
        const levelsWithThisPrice = newLevels.some(
          newLevel => newLevel.levelPrice === level.levelPrice,
        );

        if (!levelsWithThisPrice) {
          newLevels.push({
            levelTimeframe: '4h',
            levelPrice: level.levelPrice,
            levelStartCandleTime: level.levelStartCandleTime,
          });
        }
      });
    }

    if (isDrawLevelsFor1hCandles) {
      const {
        number_candles_for_calculate_1h_levels: numberCandlesForCalculate1hLevels,
      } = user.levels_monitoring_settings;

      const hourCandles = calculateOneHourTimeFrameData(candles);
      const highLevels = findHighLevels(hourCandles, numberCandlesForCalculate1hLevels);
      const lowLevels = findLowLevels(hourCandles, numberCandlesForCalculate1hLevels);

      [...highLevels, ...lowLevels].forEach(level => {
        const levelsWithThisPrice = newLevels.some(
          newLevel => newLevel.levelPrice === level.levelPrice,
        );

        if (!levelsWithThisPrice) {
          newLevels.push({
            levelTimeframe: '1h',
            levelPrice: level.levelPrice,
            levelStartCandleTime: level.levelStartCandleTime,
          });
        }
      });
    }

    if (newLevels.length) {
      await Promise.all(newLevels.map(async newLevel => {
        const resultCreateBound = await createUserLevelBound({
          userId,
          // indentInPercents,

          instrumentId: instrumentDoc._id,
          instrumentPrice: instrumentDoc.price,

          levelPrice: newLevel.levelPrice,
          levelTimeframe: newLevel.levelTimeframe,
          levelStartCandleTime: newLevel.levelStartCandleTime,
        });

        if (!resultCreateBound || !resultCreateBound.status) {
          log.warn(resultCreateBound.message || 'Cant createUserLevelBound');
          return null;
        }

        result.push(resultCreateBound.result);
      }));
    }
  }

  return res.json({
    status: true,
    result,
  });
};

const findHighLevels = (candles, distanceInBars) => {
  const levels = [];
  const lCandles = candles.length;
  const revercedCandles = [...candles].reverse();

  candles.forEach((candle, index) => {
    if (index < distanceInBars) {
      return true;
    }

    let isHighest = true;
    let isHighCrossed = false;

    for (let i = (lCandles - index); i < lCandles; i += 1) {
      const tmpCandle = revercedCandles[i];

      if (tmpCandle.high > candle.high) {
        isHighCrossed = true;
        break;
      }
    }

    if (!isHighCrossed) {
      for (let i = 0; i < distanceInBars; i += 1) {
        const tmpCandle = revercedCandles[index + i];

        if (!tmpCandle) {
          break;
        }

        if (tmpCandle.high > candle.high) {
          isHighest = false;
          break;
        }
      }
    }

    if (!isHighCrossed && isHighest) {
      levels.push({
        levelPrice: candle.high,
        levelStartCandleTime: candle.timeMaxHigh,
      });
    }
  });

  return levels;
};

const findLowLevels = (candles, distanceInBars) => {
  const levels = [];
  const lCandles = candles.length;
  const revercedCandles = [...candles].reverse();

  for (let index = 0; index < lCandles - distanceInBars; index += 1) {
    const candle = revercedCandles[index];

    let isLowest = true;
    let isLowCrossed = false;

    for (let j = index; j < revercedCandles.length; j += 1) {
      const tmpCandle = revercedCandles[j];
      if (tmpCandle.low < candle.low) {
        isLowCrossed = true;
        break;
      }
    }

    if (!isLowCrossed) {
      for (let j = 0; j < distanceInBars; j += 1) {
        const tmpCandle = revercedCandles[index - j];

        if (tmpCandle.low < candle.low) {
          isLowest = false;
          break;
        }
      }
    }

    if (!isLowCrossed && isLowest) {
      levels.push({
        levelPrice: candle.low,
        levelStartCandleTime: candle.timeMinLow,
      });
    }
  }

  return levels;
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
    let currentHourUnix = dayCandles[0].timeUnix;
    let nextCurrentHourUnix = currentHourUnix + 3600;

    dayCandles.forEach(candle => {
      if (candle.timeUnix >= nextCurrentHourUnix) {
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

    let minLow = hourCandles[0].low;
    let maxHigh = hourCandles[0].high;

    let timeMinLow = hourCandles[0].time;
    let timeMaxHigh = hourCandles[0].time;

    hourCandles.forEach(candle => {
      if (candle.high > maxHigh) {
        maxHigh = candle.high;
        timeMaxHigh = candle.time;
      }

      if (candle.low < minLow) {
        minLow = candle.low;
        timeMinLow = candle.time;
      }
    });

    returnData.push({
      high: maxHigh,
      low: minLow,
      timeMinLow,
      timeMaxHigh,
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
    let currentHourUnix = dayCandles[0].timeUnix;
    let nextCurrentHourUnix = currentHourUnix + (3600 * 4);

    dayCandles.forEach(candle => {
      if (candle.timeUnix >= nextCurrentHourUnix) {
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

    let minLow = hourCandles[0].low;
    let maxHigh = hourCandles[0].high;

    let timeMinLow = hourCandles[0].time;
    let timeMaxHigh = hourCandles[0].time;

    hourCandles.forEach(candle => {
      if (candle.high > maxHigh) {
        maxHigh = candle.high;
        timeMaxHigh = candle.time;
      }

      if (candle.low < minLow) {
        minLow = candle.low;
        timeMinLow = candle.time;
      }
    });

    returnData.push({
      high: maxHigh,
      low: minLow,
      timeMinLow,
      timeMaxHigh,
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

    let minLow = dayCandles[0].low;
    let maxHigh = dayCandles[0].high;

    let timeMinLow = dayCandles[0].time;
    let timeMaxHigh = dayCandles[0].time;

    dayCandles.forEach(candle => {
      if (candle.high > maxHigh) {
        maxHigh = candle.high;
        timeMaxHigh = candle.time;
      }

      if (candle.low < minLow) {
        minLow = candle.low;
        timeMinLow = candle.time;
      }
    });

    returnData.push({
      high: maxHigh,
      low: minLow,
      timeMinLow,
      timeMaxHigh,
    });
  });

  return returnData;
};
