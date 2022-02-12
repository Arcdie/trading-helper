const {
  isUndefined,
} = require('lodash');

const {
  isMongoId,
} = require('validator');

const redis = require('../../libs/redis');
const log = require('../../libs/logger')(module);

const {
  addFigureLevelsToRedis,
} = require('./utils/add-figure-levels-to-redis');

const InstrumentNew = require('../../models/InstrumentNew');
const UserFigureLevelBound = require('../../models/UserFigureLevelBound');

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

    const boundDoc = await UserFigureLevelBound.findById(boundId).exec();

    if (!boundDoc) {
      return res.json({
        status: false,
        message: 'No UserFigureLevelBound',
      });
    }

    if (boundDoc.user_id.toString() !== user._id.toString()) {
      return res.json({
        status: false,
        message: 'Bound has another user_id',
      });
    }

    const instrumentDoc = await InstrumentNew.findById(boundDoc.instrument_id, {
      name: 1,
    });

    if (!instrumentDoc) {
      return res.json({
        status: false,
        message: 'No InstrumentNew',
      });
    }

    const keyInstrumentLevelBounds = `INSTRUMENT:${instrumentDoc.name}:FIGURE_LEVEL_BOUNDS`;

    const prefix = boundDoc.is_long ? 'long' : 'short';
    const instrumentLevelBoundKey = `${boundDoc.level_price}_${prefix}`;

    if (!isUndefined(isModerated)) {
      boundDoc.is_moderated = isModerated;

      let cacheInstrumentLevelBounds = [];

      cacheInstrumentLevelBounds = await redis.hmgetAsync(
        keyInstrumentLevelBounds, instrumentLevelBoundKey,
      );

      if (!cacheInstrumentLevelBounds || !cacheInstrumentLevelBounds.length) {
        cacheInstrumentLevelBounds = [];
      } else {
        cacheInstrumentLevelBounds = JSON.parse(cacheInstrumentLevelBounds);
      }

      const targetBound = cacheInstrumentLevelBounds.find(
        bound => bound.bound_id === boundId,
      );

      if (targetBound) {
        targetBound.is_moderated = boundDoc.is_moderated;

        await redis.hmsetAsync(
          keyInstrumentLevelBounds,
          instrumentLevelBoundKey,
          JSON.stringify(cacheInstrumentLevelBounds),
        );
      }
    }

    if (!isUndefined(isActive)) {
      boundDoc.is_active = isActive;

      if (!boundDoc.is_active) {
        await redis.hdelAsync(
          keyInstrumentLevelBounds,
          [instrumentLevelBoundKey],
        );
      } else {
        const resultAddFigureLevel = await addFigureLevelsToRedis({
          userId: user._id,
          instrumentName: instrumentDoc.name,

          levels: [{
            boundId: boundDoc._id.toString(),
            levelPrice: boundDoc.level_price,

            isLong: boundDoc.is_long,
            isModerated: boundDoc.is_moderated,
          }],
        });

        if (!resultAddFigureLevel || !resultAddFigureLevel.status) {
          log.warn(resultAddFigureLevel.message || 'Cant addFigureLevelsToRedis');
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
