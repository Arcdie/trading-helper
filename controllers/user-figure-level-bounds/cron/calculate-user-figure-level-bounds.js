const moment = require('moment');

const log = require('../../../libs/logger')(module);

const {
  getUnix,
  processedInstrumentsCounter,
} = require('../../../libs/support');

const {
  getCandles,
} = require('../../candles/utils/get-candles');

const {
  clearFigureLevelsInRedis,
} = require('../utils/clear-figure-levels-in-redis');

const {
  getLowLevels,
} = require('../utils/get-low-levels');

const {
  getHighLevels,
} = require('../utils/get-high-levels');

const {
  addFigureLevelsToRedis,
} = require('../utils/add-figure-levels-to-redis');

const {
  getActiveInstruments,
} = require('../../instruments/utils/get-active-instruments');

const {
  createUserFigureLevelBound,
} = require('../utils/create-user-figure-level-bound');

const {
  INTERVALS,
} = require('../../candles/constants');

const User = require('../../../models/User');
const UserFigureLevelBound = require('../../../models/UserFigureLevelBound');

module.exports = async (req, res, next) => {
  try {
    const {
      query: {
        endTime,
      },
    } = req;

    res.json({
      status: true,
    });

    if (endTime && !moment(endTime).isValid()) {
      log.warn('Invalid endTime');
      return false;
    }

    await clearFigureLevelsInRedis();

    const usersDocs = await User.find({}, {
      figure_levels_settings: 1,
    }).exec();

    if (!usersDocs || !usersDocs.length) {
      return true;
    }

    const resultGetInstruments = await getActiveInstruments({
      isOnlyFutures: true,
    });

    if (!resultGetInstruments || !resultGetInstruments.status) {
      log.warn(resultGetInstruments.message || 'Cant getActiveInstruments');
      return false;
    }

    const instrumentsDocs = resultGetInstruments.result;

    if (!instrumentsDocs || !instrumentsDocs.length) {
      return true;
    }

    const incrementProcessedInstruments = processedInstrumentsCounter(instrumentsDocs.length);

    for await (const instrumentDoc of instrumentsDocs) {
      const resultGet1hCandles = await getValidCandles({
        endTime,
        interval: INTERVALS.get('1h'),
        instrumentId: instrumentDoc._id,
      });

      if (!resultGet1hCandles || !resultGet1hCandles.status) {
        log.warn(resultGet1hCandles.message || `Cant getCandles (${INTERVALS.get('1h')})`);
      }

      const candles1h = resultGet1hCandles.result || [];

      for await (const userDoc of usersDocs) {
        if (!userDoc.figure_levels_settings) {
          userDoc.figure_levels_settings = {};
        }

        const {
          distance_from_left_side: distanceFromLeftSide,
          distance_from_right_side: distanceFromRightSide,
        } = userDoc.figure_levels_settings;

        if (!distanceFromLeftSide && !distanceFromRightSide) {
          continue;
        }

        const newLevels = [];

        const userLevelBounds = await UserFigureLevelBound.find({
          user_id: userDoc._id,
          instrument_id: instrumentDoc._id,

          is_worked: false,
        }, {
          level_price: 1,

          is_long: 1,
          is_moderated: 1,
        }).exec();

        const highLevels = getHighLevels({
          candles: candles1h,
          distanceFromLeftSide,
          distanceFromRightSide,
        });

        // const lowLevels = [];
        const lowLevels = getLowLevels({
          candles: candles1h,
          distanceFromLeftSide,
          distanceFromRightSide,
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
              levelPrice: level.levelPrice,
              levelTimeframe: INTERVALS.get('1h'),
              levelStartCandleTime: level.levelStartCandleTime,
            });
          }
        });

        if (newLevels.length) {
          await Promise.all(newLevels.map(async newLevel => {
            const resultCreateBound = await createUserFigureLevelBound({
              userId: userDoc._id,

              instrumentId: instrumentDoc._id,
              instrumentName: instrumentDoc.name,
              instrumentPrice: instrumentDoc.price,

              levelPrice: newLevel.levelPrice,
              levelTimeframe: newLevel.levelTimeframe,
              levelStartCandleTime: newLevel.levelStartCandleTime,
            });

            if (!resultCreateBound || !resultCreateBound.status) {
              log.warn(resultCreateBound.message || 'Cant createUserFigureLevelBound');
              return null;
            }
          }));
        }

        incrementProcessedInstruments();

        await addFigureLevelsToRedis({
          userId: userDoc._id,
          instrumentName: instrumentDoc.name,

          levels: userLevelBounds.map(bound => ({
            boundId: bound._id,
            levelPrice: bound.level_price,

            isLong: bound.is_long,
            isModerated: bound.is_moderated,
          })),
        });
      }
    }

    // res.json({
    //   status: true,
    // });

    console.log('finished');
  } catch (error) {
    log.warn(error.message);
    return false;
  }
};

const getValidCandles = async ({
  endTime,
  interval,
  instrumentId,
}) => {
  const resultGetCandles = await getCandles({
    endTime,
    interval,
    instrumentId,
  });

  if (!resultGetCandles || !resultGetCandles.status) {
    return {
      status: false,
      message: resultGetCandles.message || 'Cant getCandles',
    };
  }

  let candles = resultGetCandles.result;

  candles.forEach(candle => {
    candle.originalTimeUnix = getUnix(candle.time);

    candle.open = candle.data[0];
    candle.close = candle.data[1];
    candle.low = candle.data[2];
    candle.high = candle.data[3];
  });

  candles = candles.sort((a, b) => a.originalTimeUnix < b.originalTimeUnix ? -1 : 1);

  return {
    status: true,
    result: candles,
  };
};
