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
  clearLevelsInRedis,
} = require('../utils/clear-levels-in-redis');

const {
  getHighLevels,
} = require('../utils/get-high-levels');

const {
  addLevelsToRedis,
} = require('../utils/add-levels-to-redis');

const {
  getActiveInstruments,
} = require('../../instruments/utils/get-active-instruments');

const {
  createUserLevelBound,
} = require('../utils/create-user-level-bound');

const User = require('../../../models/User');
const UserLevelBound = require('../../../models/UserLevelBound');

module.exports = async (req, res, next) => {
  await clearLevelsInRedis();

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

  for await (const instrumentDoc of instrumentsDocs) {
    const fetchPromises = [
      getValidCandles({
        interval: '1d',
        instrumentId: instrumentDoc._id,
      }),

      getValidCandles({
        interval: '4h',
        instrumentId: instrumentDoc._id,
      }),

      getValidCandles({
        interval: '1h',
        instrumentId: instrumentDoc._id,
      }),
    ];

    const [
      resultGetDayCandles,
      resultGet4hCandles,
      resultGet1hCandles,
    ] = await Promise.all(fetchPromises);

    if (!resultGetDayCandles || !resultGetDayCandles.status) {
      log.warn(resultGetDayCandles.message || 'Cant getCandles (1d)');
    }

    if (!resultGet4hCandles || !resultGet4hCandles.status) {
      log.warn(resultGet4hCandles.message || 'Cant getCandles (4h)');
    }

    if (!resultGet1hCandles || !resultGet1hCandles.status) {
      log.warn(resultGet1hCandles.message || 'Cant getCandles (1h)');
    }

    const candles1d = resultGetDayCandles.result || [];
    const candles4h = resultGetDayCandles.result || [];
    const candles1h = resultGetDayCandles.result || [];

    for await (const userDoc of usersDocs) {
      if (!userDoc.levels_monitoring_settings) {
        userDoc.levels_monitoring_settings = {};
      }

      const {
        is_draw_levels_for_1h_candles: isDrawLevelsFor1hCandles,
        is_draw_levels_for_4h_candles: isDrawLevelsFor4hCandles,
        is_draw_levels_for_1d_candles: isDrawLevelsForDayCandles,

        number_candles_for_calculate_1d_levels: numberCandlesForCalculateDayLevels,
        number_candles_for_calculate_4h_levels: numberCandlesForCalculate4hLevels,
        number_candles_for_calculate_1h_levels: numberCandlesForCalculate1hLevels,
      } = userDoc.levels_monitoring_settings;

      if (!isDrawLevelsFor1hCandles && !isDrawLevelsFor4hCandles && !isDrawLevelsForDayCandles) {
        continue;
      }

      const newLevels = [];

      const userLevelBounds = await UserLevelBound.find({
        user_id: userDoc._id,
        instrument_id: instrumentDoc._id,

        is_worked: false,
      }, {
        is_long: 1,
        level_price: 1,
      }).exec();

      if (isDrawLevelsForDayCandles) {
        const highLevels = getHighLevels({
          candles: candles1d,
          distanceInBars: numberCandlesForCalculateDayLevels,
        });

        const lowLevels = getLowLevels({
          candles: candles1d,
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
        const highLevels = getHighLevels({
          candles: candles4h,
          distanceInBars: numberCandlesForCalculate4hLevels,
        });

        const lowLevels = getLowLevels({
          candles: candles4h,
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
        const highLevels = getHighLevels({
          candles: candles1h,
          distanceInBars: numberCandlesForCalculate1hLevels,
        });

        const lowLevels = getLowLevels({
          candles: candles1h,
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
        // for await (const newLevel of newLevels) {}
        await Promise.all(newLevels.map(async newLevel => {
          const resultCreateBound = await createUserLevelBound({
            userId: userDoc._id,

            instrumentId: instrumentDoc._id,
            instrumentName: instrumentDoc.name,
            instrumentPrice: instrumentDoc.price,

            levelPrice: newLevel.levelPrice,
            levelTimeframe: newLevel.levelTimeframe,
            levelStartCandleTime: newLevel.levelStartCandleTime,
          });

          if (!resultCreateBound || !resultCreateBound.status) {
            log.warn(resultCreateBound.message || 'Cant createUserLevelBound');
            return null;
            // continue;
          }
        }));
      }

      await addLevelsToRedis({
        userId: userDoc._id,
        instrumentName: instrumentDoc.name,

        levels: userLevelBounds.map(bound => ({
          boundId: bound._id,
          isLong: bound.is_long,
          levelPrice: bound.level_price,
        })),
      });
    }

    console.log('ended', instrumentDoc.name);
  }

  console.log('end');
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
