const {
  isMongoId,
} = require('validator');

const redis = require('../../../libs/redis');
const log = require('../../../libs/logger')(module);

const {
  getUnix,
} = require('../../../libs/support');

const {
  INTERVALS_SETTINGS,
} = require('../constants');

const {
  INTERVALS,
} = require('../../candles/constants');

const UserFigureLineBound = require('../../../models/UserFigureLineBound');

const checkUserFigureLineBounds = async ({
  instrumentId,
  instrumentName,
  instrumentPrice,
}) => {
  try {
    if (!instrumentId || !isMongoId(instrumentId.toString())) {
      return {
        status: false,
        message: 'No or invalid instrumentId',
      };
    }

    if (!instrumentName) {
      return {
        status: false,
        message: 'No instrumentName',
      };
    }

    if (!instrumentPrice) {
      return {
        status: false,
        message: 'No instrumentPrice',
      };
    }

    const keyInstrumentLineBounds = `INSTRUMENT:${instrumentName}:FIGURE_LINE_BOUNDS`;
    let cacheInstrumentLineBounds = await redis.getAsync(keyInstrumentLineBounds);

    if (!cacheInstrumentLineBounds) {
      cacheInstrumentLineBounds = [];
    } else {
      cacheInstrumentLineBounds = JSON.parse(cacheInstrumentLineBounds);
    }

    if (!cacheInstrumentLineBounds.length) {
      return {
        status: true,
      };
    }

    const boundsIds = [];

    const divider = 3600;
    const nowUnix = getUnix();
    const startOfHourUnix = nowUnix - (nowUnix % divider);

    const intervalSettings = INTERVALS_SETTINGS[INTERVALS.get('1h')];

    const newListBounds = cacheInstrumentLineBounds.filter(bound => {
      const numberHoursBetweenDates = (startOfHourUnix - bound.candle_time) / divider;

      if (bound.is_long) {
        const linePrice = bound.candle_extremum + (bound.price_angle * numberHoursBetweenDates);
        const allowedBreakdown = linePrice - (linePrice * (intervalSettings.ALLOWED_PERCENT / 100));

        if (instrumentPrice < allowedBreakdown) {
          boundsIds.push(bound.bound_id);
          return false;
        }
      } else {
        const linePrice = bound.candle_extremum - (bound.price_angle * numberHoursBetweenDates);
        const allowedBreakdown = linePrice + (linePrice * (intervalSettings.ALLOWED_PERCENT / 100));

        if (instrumentPrice > allowedBreakdown) {
          boundsIds.push(bound.bound_id);
          return false;
        }
      }

      return true;
    });

    if (boundsIds.length) {
      await redis.setAsync([keyInstrumentLineBounds, JSON.stringify(newListBounds)]);

      await UserFigureLineBound.updateMany({
        _id: {
          $in: boundsIds,
        },
      }, {
        is_worked: true,
        worked_at: new Date(),
      });
    }

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
  checkUserFigureLineBounds,
};
