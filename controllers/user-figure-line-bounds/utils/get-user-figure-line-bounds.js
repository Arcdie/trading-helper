const {
  isUndefined,
} = require('lodash');

const {
  isMongoId,
} = require('validator');

const log = require('../../../libs/logger')(module);

const {
  INTERVALS,
} = require('../../candles/constants');

const UserFigureLineBound = require('../../../models/UserFigureLineBound');

const getUserFigureLineBounds = async ({
  userId,
  isActive,
  isWorked,
  isModerated,

  timeframe,
}) => {
  try {
    if (!userId || !isMongoId(userId.toString())) {
      return {
        status: false,
        message: 'No or invalid userId',
      };
    }

    if (timeframe && !INTERVALS.get(timeframe)) {
      return {
        status: false,
        message: 'No or invalid timeframe',
      };
    }

    const searchObj = {
      user_id: userId,
    };

    if (!isUndefined(isWorked)) {
      searchObj.is_worked = isWorked;
    }

    if (!isUndefined(isActive)) {
      searchObj.is_active = isActive;
    }

    if (!isUndefined(isModerated)) {
      searchObj.is_moderated = isModerated;
    }

    if (timeframe) {
      searchObj.line_timeframe = timeframe;
    }

    const userLineBounds = await UserFigureLineBound.find(searchObj).exec();

    return {
      status: true,
      result: userLineBounds.map(bound => bound._doc),
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
  getUserFigureLineBounds,
};
