const log = require('../../../libs/logger');

const {
  getUnix,
} = require('../../../libs/support');

const {
  getCandles,
} = require('../../candles/utils/get-candles');

const {
  getLowLevels,
} = require('../utils/get-low-levels');

const {
  getHighLevels,
} = require('../utils/get-high-levels');

const {
  getActiveInstruments,
} = require('../../instruments/utils/get-active-instruments');

const {
  createUserLevelBound,
} = require('../utils/create-user-level-bound');

const User = require('../../../models/User');
const UserLevelBound = require('../../../models/UserLevelBound');

module.exports = async (req, res, next) => {
  const usersDocs = await User.find({}, {
    levels_monitoring_settings: 1,
  }).exec();

  if (!usersDocs || !usersDocs.length) {
    return {
      status: true,
    };
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
    };
  }

  for (const user of usersDocs) {
    if (!user.levels_monitoring_settings) {
      user.levels_monitoring_settings = {};
    }

    const {
      is_draw_levels_for_1h_candles: isDrawLevelsFor1hCandles,
      is_draw_levels_for_4h_candles: isDrawLevelsFor4hCandles,
      is_draw_levels_for_1d_candles: isDrawLevelsForDayCandles,

      number_candles_for_calculate_1d_levels: numberCandlesForCalculateDayLevels,
      number_candles_for_calculate_4h_levels: numberCandlesForCalculate4hLevels,
      number_candles_for_calculate_1h_levels: numberCandlesForCalculate1hLevels,
    } = user.levels_monitoring_settings;

    if (!isDrawLevelsFor1hCandles && !isDrawLevelsFor4hCandles && !isDrawLevelsForDayCandles) {
      continue;
    }

    for (const instrumentDoc of instrumentsDocs) {
      const newLevels = [];

      const userLevelBounds = await UserLevelBound.find({
        user_id: user._id,
        instrument_id: instrumentDoc._id,

        is_worked: false,
      }, { level_price: 1 }).exec();

      if (isDrawLevelsForDayCandles) {
        const resultGetDayCandles = await getValidCandles({
          interval: '1d',
          instrumentId: instrumentDoc._id,
        });

        if (!resultGetDayCandles || !resultGetDayCandles.status) {
          log.warn(resultGetDayCandles.message || 'Cant getCandles');
          continue;
        }

        const highLevels = getHighLevels({
          candles: resultGetDayCandles.result,
          distanceInBars: numberCandlesForCalculateDayLevels,
        });

        const lowLevels = getLowLevels({
          candles: resultGetDayCandles.result,
          distanceInBars: numberCandlesForCalculateDayLevels,
        });

        [...highLevels, ...lowLevels].forEach(level => {
          const levelWithThisPrice = newLevels.some(
            newLevel => newLevel.levelPrice === level.levelPrice,
          );

          const levelWithThisPriceInBounds = userLevelBounds.some(
            bound => bound.level_price === level.levelPrice,
          );

          if (!levelWithThisPrice && !levelWithThisPriceInBounds) {
            newLevels.push({
              levelTimeframe: '1d',
              levelPrice: level.levelPrice,
              levelStartCandleTime: level.levelStartCandleTime,
            });
          }
        });
      }

      if (isDrawLevelsFor4hCandles) {
        const resultGet4hCandles = await getValidCandles({
          interval: '4h',
          instrumentId: instrumentDoc._id,
        });

        if (!resultGet4hCandles || !resultGet4hCandles.status) {
          log.warn(resultGet4hCandles.message || 'Cant getCandles');
          continue;
        }

        const highLevels = getHighLevels({
          candles: resultGet4hCandles.result,
          distanceInBars: numberCandlesForCalculate4hLevels,
        });

        const lowLevels = getLowLevels({
          candles: resultGet4hCandles.result,
          distanceInBars: numberCandlesForCalculate4hLevels,
        });

        [...highLevels, ...lowLevels].forEach(level => {
          const levelWithThisPrice = newLevels.some(
            newLevel => newLevel.levelPrice === level.levelPrice,
          );

          const levelWithThisPriceInBounds = userLevelBounds.some(
            bound => bound.level_price === level.levelPrice,
          );

          if (!levelWithThisPrice && !levelWithThisPriceInBounds) {
            newLevels.push({
              levelTimeframe: '4h',
              levelPrice: level.levelPrice,
              levelStartCandleTime: level.levelStartCandleTime,
            });
          }
        });
      }

      if (isDrawLevelsFor1hCandles) {
        const resultGet1hCandles = await getValidCandles({
          interval: '1h',
          instrumentId: instrumentDoc._id,
        });

        if (!resultGet1hCandles || !resultGet1hCandles.status) {
          log.warn(resultGet1hCandles.message || 'Cant getCandles');
          continue;
        }

        const highLevels = getHighLevels({
          candles: resultGet1hCandles.result,
          distanceInBars: numberCandlesForCalculate1hLevels,
        });

        const lowLevels = getLowLevels({
          candles: resultGet1hCandles.result,
          distanceInBars: numberCandlesForCalculate1hLevels,
        });

        [...highLevels, ...lowLevels].forEach(level => {
          const levelWithThisPrice = newLevels.some(
            newLevel => newLevel.levelPrice === level.levelPrice,
          );

          const levelWithThisPriceInBounds = userLevelBounds.some(
            bound => bound.level_price === level.levelPrice,
          );

          if (!levelWithThisPrice && !levelWithThisPriceInBounds) {
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
            userId: user._id,
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
        }));
      }
    }
  }

  return res.json({ status: true });
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
