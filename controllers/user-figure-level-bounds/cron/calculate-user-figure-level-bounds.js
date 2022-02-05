const log = require('../../../libs/logger')(module);

const {
  getUnix,
} = require('../../../libs/support');

const {
  getCandles,
} = require('../../candles/utils/get-candles');

const {
  clearLevelsInRedis,
} = require('../utils/clear-levels-in-redis');

const {
  getLowLevels,
} = require('../utils/get-low-levels');

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
  createUserFigureLevelBound,
} = require('../utils/create-user-figure-level-bound');

const {
  INTERVALS,
} = require('../../candles/constants');

const User = require('../../../models/User');
const UserFigureLevelBound = require('../../../models/UserFigureLevelBound');

module.exports = async (req, res, next) => {
  try {
    res.json({
      status: true,
    });

    await clearLevelsInRedis();

    const usersDocs = await User.find({
      _id: '6176a452ef4c0005812a9729',
    }, {
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

    const instrumentsDocs = resultGetInstruments.result
      .filter(d => d.name === 'IOTXUSDTPERP');

    if (!instrumentsDocs || !instrumentsDocs.length) {
      return true;
    }

    for await (const instrumentDoc of instrumentsDocs) {
      const resultGet1hCandles = await getValidCandles({
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
          is_long: 1,
          level_price: 1,
        }).exec();

        const highLevels = getHighLevels({
          candles: candles1h,
          distanceFromLeftSide,
          distanceFromRightSide,
        });

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
    }
  } catch (error) {
    log.warn(error.message);
    return false;
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
