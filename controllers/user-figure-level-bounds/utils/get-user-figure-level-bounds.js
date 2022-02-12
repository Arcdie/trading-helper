const {
  isUndefined,
} = require('lodash');

const {
  isMongoId,
} = require('validator');

const log = require('../../../libs/logger')(module);

const UserFigureLevelBound = require('../../../models/UserFigureLevelBound');

const getUserFigureLevelBounds = async ({
  userId,
  isActive,
  isWorked,
  isModerated,
}) => {
  try {
    if (!userId || !isMongoId(userId.toString())) {
      return {
        status: false,
        message: 'No or invalid userId',
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

    const userLevelBounds = await UserFigureLevelBound.find(searchObj).exec();

    return {
      status: true,
      result: userLevelBounds.map(bound => bound._doc),
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
  getUserFigureLevelBounds,
};
