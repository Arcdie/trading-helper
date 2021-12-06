const {
  isMongoId,
} = require('validator');

const log = require('../../libs/logger')(module);

const {
  getUnix,
} = require('../../libs/support');

const {
  sendPrivateData,
} = require('../../websocket/websocket-server');

const {
  getCandles,
} = require('../candles/utils/get-candles');

const {
  getLowLevels,
} = require('./utils/get-low-levels');

const {
  getHighLevels,
} = require('./utils/get-high-levels');

const {
  getActiveInstruments,
} = require('../instruments/utils/get-active-instruments');

const {
  createUserLevelBound,
} = require('./utils/create-user-level-bound');

const {
  PRIVATE_ACTION_NAMES,
} = require('../../websocket/constants');

const UserLevelBound = require('../../models/UserLevelBound');

module.exports = async (req, res, next) => {
  try {
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

    await UserLevelBound.deleteMany({
      user_id: userId,
    });

    if (!isDrawLevelsFor1hCandles && !isDrawLevelsFor4hCandles && !isDrawLevelsForDayCandles) {
      return {
        status: true,
        result: [],
      };
    }

    for (const instrumentDoc of instrumentsDocs) {
      const newLevels = [];

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

        [...highLevels || [], ...lowLevels || []].forEach(level => {
          const levelsWithThisPrice = newLevels.some(
            newLevel => newLevel.levelPrice === level.levelPrice,
          );

          if (!levelsWithThisPrice) {
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

        [...highLevels || [], ...lowLevels || []].forEach(level => {
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

        [...highLevels || [], ...lowLevels || []].forEach(level => {
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
            instrumentName: instrumentDoc.name,
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

      sendPrivateData({
        userId: user._id,
        actionName: PRIVATE_ACTION_NAMES.get('levelsLoaded'),
        data: { instrumentId: instrumentDoc._id },
      });
    }

    sendPrivateData({
      userId: user._id,
      actionName: PRIVATE_ACTION_NAMES.get('userLevelBoundsCreated'),
    });

    return res.json({
      status: true,
      result,
    });
  } catch (error) {
    log.warn(error.message);

    return res.json({
      status: false,
      message: error.message,
    });
  }
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
