const {
  isUndefined,
} = require('lodash');

const {
  isMongoId,
} = require('validator');

const redis = require('../../libs/redis');
const log = require('../../libs/logger')(module);

const {
  addFigureLinesToRedis,
} = require('./utils/add-figure-lines-to-redis');

const InstrumentNew = require('../../models/InstrumentNew');
const UserFigureLineBound = require('../../models/UserFigureLineBound');

module.exports = async (req, res, next) => {
  try {
    const {
      params: {
        boundId,
      },

      body: {
        isActive,
        isModerated,
      },

      user,
    } = req;

    if (!user) {
      return res.json({
        status: false,
        message: 'Not authorized',
      });
    }

    if (!boundId || !isMongoId(boundId)) {
      return res.json({
        status: false,
        message: 'No or invalid boundId',
      });
    }

    const boundDoc = await UserFigureLineBound.findById(boundId).exec();

    if (!boundDoc) {
      return res.json({
        status: false,
        message: 'No UserFigureLineBound',
      });
    }

    if (boundDoc.user_id.toString() !== user._id.toString()) {
      return res.json({
        status: false,
        message: 'Bound has another user_id',
      });
    }

    if (!isUndefined(isModerated)) {
      boundDoc.is_moderated = isModerated;
    }

    if (!isUndefined(isActive)) {
      boundDoc.is_active = isActive;

      const instrumentDoc = await InstrumentNew.findById(boundDoc.instrument_id, {
        name: 1,
      });

      if (!instrumentDoc) {
        return res.json({
          status: false,
          message: 'No InstrumentNew',
        });
      }

      if (!boundDoc.is_active) {
        const keyInstrumentLineBounds = `INSTRUMENT:${instrumentDoc.name}:FIGURE_LINE_BOUNDS`;
        let cacheInstrumentLineBounds = await redis.getAsync(keyInstrumentLineBounds);

        if (!cacheInstrumentLineBounds) {
          cacheInstrumentLineBounds = [];
        } else {
          cacheInstrumentLineBounds = JSON.parse(cacheInstrumentLineBounds);
        }

        const boundId = boundDoc._id.toString();

        cacheInstrumentLineBounds = cacheInstrumentLineBounds
          .filter(figureLine => figureLine.bound_id !== boundId);

        await redis.setAsync([keyInstrumentLineBounds, JSON.stringify(cacheInstrumentLineBounds)]);
      } else {
        const resultAddFigureLine = await addFigureLinesToRedis({
          userId: user._id,
          instrumentName: instrumentDoc.name,

          figureLines: [{
            // user_id: userId,
            boundId: boundDoc._id.toString(),
            priceAngle: boundDoc.price_angle,
            lineTimeframe: boundDoc.line_timeframe,
            lineStartCandleTime: boundDoc.line_start_candle_time,
            lineStartCandleExtremum: boundDoc.line_start_candle_extremum,

            isLong: boundDoc.is_long,
            isModerated: boundDoc.is_moderated,
          }],
        });

        if (!resultAddFigureLine || !resultAddFigureLine.status) {
          log.warn(resultAddFigureLine.message || 'Cant addFigureLinesToRedis');
        }
      }
    }

    await boundDoc.save();

    return res.json({
      status: true,
      result: boundDoc._doc,
    });
  } catch (error) {
    log.warn(error.message);

    return res.json({
      status: false,
      message: error.message,
    });
  }
};
