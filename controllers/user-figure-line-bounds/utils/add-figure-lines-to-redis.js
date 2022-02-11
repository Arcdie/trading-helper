const {
  isMongoId,
} = require('validator');

const redis = require('../../../libs/redis');
const log = require('../../../libs/logger')(module);

const {
  getUnix,
} = require('../../../libs/support');

const addFigureLinesToRedis = async ({
  userId,
  instrumentName,

  figureLines,
}) => {
  try {
    if (!userId || !isMongoId(userId.toString())) {
      return {
        status: false,
        message: 'No or invalid userId',
      };
    }

    if (!instrumentName) {
      return {
        status: false,
        message: 'No instrumentName',
      };
    }

    if (!figureLines || !figureLines.length) {
      return {
        status: false,
        message: 'No or empty figureLines',
      };
    }

    const keyInstrumentLineBounds = `INSTRUMENT:${instrumentName}:FIGURE_LINE_BOUNDS`;
    let cacheInstrumentLineBounds = await redis.getAsync(keyInstrumentLineBounds);

    if (!cacheInstrumentLineBounds) {
      cacheInstrumentLineBounds = [];
    } else {
      cacheInstrumentLineBounds = JSON.parse(cacheInstrumentLineBounds);
    }

    const newFigureLines = figureLines.filter(figureLine => {
      const boundId = figureLine.boundId.toString();

      return !cacheInstrumentLineBounds.some(
        bound => bound.bound_id === boundId,
      );
    });

    cacheInstrumentLineBounds.push(...newFigureLines.map(newFigureLine => ({
      // user_id: userId,
      bound_id: newFigureLine.boundId,
      is_long: newFigureLine.isLong,
      price_angle: newFigureLine.priceAngle,
      timeframe: newFigureLine.lineTimeframe,
      candle_extremum: newFigureLine.lineStartCandleExtremum,
      candle_time: getUnix(newFigureLine.lineStartCandleTime),
    })));

    await redis.setAsync([keyInstrumentLineBounds, JSON.stringify(cacheInstrumentLineBounds)]);

    return {
      status: true,
    };
  } catch (error) {
    log.warn(error.message);

    return {
      status: false,
      message: error.message,
    };
  }
};

module.exports = {
  addFigureLinesToRedis,
};
