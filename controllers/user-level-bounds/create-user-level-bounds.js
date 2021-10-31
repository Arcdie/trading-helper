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

const Candle1h = require('../../models/Candle-1h');
const Candle4h = require('../../models/Candle-4h');
const Candle1d = require('../../models/Candle-1d');
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
  const newLevels = [];

  await UserLevelBound.deleteMany({
    user_id: userId,
  });

  for (const instrumentDoc of instrumentsDocs) {
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

      const resultGetCandles = await getValidCandles({
        interval: 'day',
        instrumentId: instrumentDoc._id,
      });

      if (!resultGetCandles || !resultGetCandles.status) {
        log.warn(resultGetCandles.message || 'Cant getCandles');
        continue;
      }

      const highLevels = findHighLevels(resultGetCandles.result, numberCandlesForCalculateDayLevels);
      const lowLevels = findLowLevels(resultGetCandles.result, numberCandlesForCalculateDayLevels);

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

      const resultGetCandles = await getValidCandles({
        interval: '4h',
        instrumentId: instrumentDoc._id,
      });

      if (!resultGetCandles || !resultGetCandles.status) {
        log.warn(resultGetCandles.message || 'Cant getCandles');
        continue;
      }

      const highLevels = findHighLevels(resultGetCandles.result, numberCandlesForCalculate4hLevels);
      const lowLevels = findLowLevels(resultGetCandles.result, numberCandlesForCalculate4hLevels);

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

      const resultGetCandles = await getValidCandles({
        interval: '1h',
        instrumentId: instrumentDoc._id,
      });

      if (!resultGetCandles || !resultGetCandles.status) {
        log.warn(resultGetCandles.message || 'Cant getCandles');
        continue;
      }

      const highLevels = findHighLevels(resultGetCandles.result, numberCandlesForCalculate1hLevels);
      const lowLevels = findLowLevels(resultGetCandles.result, numberCandlesForCalculate1hLevels);

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

const getValidCandles = async ({
  interval,
  instrumentId,
}) => {
  const resultGetCandles = await getCandles({
    interval,
    instrumentId,
  });

  if (!resultGetCandles || !resultGetCandles.status) {
    return {
      status: false,
      message: resultGetCandles.message || 'Cant getCandles',
    };
  }

  const candles = resultGetCandles.result;

  candles.forEach(candle => {
    candle.timeUnix = getUnix(candle.time);

    candle.open = candle.data[0];
    candle.close = candle.data[1];
    candle.low = candle.data[2];
    candle.high = candle.data[3];
  });

  return {
    status: true,
    result: candles,
  };
};
