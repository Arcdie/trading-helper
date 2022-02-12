const moment = require('moment');

const log = require('../../../libs/logger')(module);

const {
  getUnix,
} = require('../../../libs/support');

const {
  getCandles,
} = require('../../candles/utils/get-candles');

const {
  getLongFigureLines,
} = require('../utils/get-long-figure-lines');

const {
  getShortFigureLines,
} = require('../utils/get-short-figure-lines');

const {
  addFigureLinesToRedis,
} = require('../utils/add-figure-lines-to-redis');

/*
const {
  clearFigureLinesFromRedis,
} = require('../utils/clear-figure-lines-from-redis');
*/

const {
  createUserFigureLineBound,
} = require('../utils/create-user-figure-line-bound');

const {
  getActiveInstruments,
} = require('../../instruments/utils/get-active-instruments');

const {
  INTERVALS_SETTINGS,
} = require('../constants');

const {
  INTERVALS,
} = require('../../candles/constants');

const User = require('../../../models/User');
const UserFigureLineBound = require('../../../models/UserFigureLineBound');

module.exports = async (req, res, next) => {
  try {
    res.json({
      status: true,
    });

    const usersDocs = await User.find({
      _id: '6176a452ef4c0005812a9729',
    }, {
      figure_lines_settings: 1,
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
    // const instrumentsDocs = resultGetInstruments.result.filter(d => d.name === 'RAYUSDTPERP');

    if (!instrumentsDocs || !instrumentsDocs.length) {
      return true;
    }

    const startDate = moment().startOf('day')
      .add(-INTERVALS_SETTINGS[INTERVALS.get('1h')].SUBTRACT_TIME, 'seconds');

    for await (const instrumentDoc of instrumentsDocs) {
      const resultGet1hCandles = await getValidCandles({
        interval: INTERVALS.get('1h'),
        instrumentId: instrumentDoc._id,

        startDate,
      });

      if (!resultGet1hCandles || !resultGet1hCandles.status) {
        log.warn(resultGet1hCandles.message || `Cant getCandles (${INTERVALS.get('1h')})`);
      }

      const candles1h = resultGet1hCandles.result || [];

      const intervalSettings = INTERVALS_SETTINGS[INTERVALS.get('1h')];

      for await (const userDoc of usersDocs) {
        if (!userDoc.figure_lines_settings) {
          userDoc.figure_lines_settings = {};
        }

        // todo: use users settings

        const newFigureLines = [];

        const userLineBounds = await UserFigureLineBound.find({
          user_id: userDoc._id,
          instrument_id: instrumentDoc._id,
        }, {
          price_angle: 1,
          line_start_candle_time: 1,
        }).exec();

        const longFigureLines = getLongFigureLines(candles1h, intervalSettings);
        const shortFigureLines = getShortFigureLines(candles1h, intervalSettings);

        [...longFigureLines, ...shortFigureLines].forEach(figureLine => {
          // const doesExistDublicate = newFigureLines.some(
          //   newLine => newLine.priceAngle === figureLine.priceAngle
          //     && newLine.lineStartCandleTimeUnix === figureLine.lineStartCandleTimeUnix,
          // );

          const doesExistDublicateInBounds = userLineBounds.some(
            bound => bound.price_angle === figureLine.priceAngle
              && getUnix(bound.line_start_candle_time) === figureLine.lineStartCandleTimeUnix,
          );

          // if (!doesExistDublicate || !doesExistDublicateInBounds) {
          if (!doesExistDublicateInBounds) {
            newFigureLines.push({
              ...figureLine,
              lineTimeframe: INTERVALS.get('1h'),
            });
          }
        });

        if (newFigureLines.length) {
          const newBounds = [];

          await Promise.all(newFigureLines.map(async newFigureLine => {
            const resultCreateBound = await createUserFigureLineBound({
              userId: userDoc._id,

              instrumentId: instrumentDoc._id,
              instrumentName: instrumentDoc.name,

              ...newFigureLine,
            });

            if (!resultCreateBound || !resultCreateBound.status) {
              log.warn(resultCreateBound.message || 'Cant createUserFigureLineBound');
              return null;
            }

            newBounds.push(resultCreateBound.result);
          }));

          await addFigureLinesToRedis({
            userId: userDoc._id,
            instrumentName: instrumentDoc.name,

            figureLines: newBounds.map(newBound => ({
              isLong: newBound.is_long,
              isModerated: newBound.is_moderated,

              priceAngle: newBound.price_angle,
              boundId: newBound._id.toString(),
              lineTimeframe: newBound.line_timeframe,
              lineStartCandleTime: newBound.line_start_candle_time,
              lineStartCandleExtremum: newBound.line_start_candle_extremum,
            })),
          });
        }
      }
    }

    // log.info('Finished calculate user-figure-line-bounds');
  } catch (error) {
    log.warn(error.message);
    return false;
  }
};

const getValidCandles = async ({
  interval,
  instrumentId,

  startDate,
}) => {
  const resultGetCandles = await getCandles({
    interval,
    instrumentId,

    startTime: startDate,
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

    candle.isLong = candle.close > candle.open;
  });

  candles = candles.sort((a, b) => a.originalTimeUnix < b.originalTimeUnix ? -1 : 1);

  return {
    status: true,
    result: candles,
  };
};
