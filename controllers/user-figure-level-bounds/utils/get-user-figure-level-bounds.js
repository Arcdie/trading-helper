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
  isWorked,
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
