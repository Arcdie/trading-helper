const {
  isUndefined,
} = require('lodash');

const {
  isMongoId,
  isBoolean,
} = require('validator');

const UserLevelBound = require('../../../models/UserLevelBound');

const getUserLevelBounds = async ({
  userId,
  isWorked,
}) => {
  if (!userId || !isMongoId(userId.toString())) {
    return {
      status: false,
      message: 'No or invalid userId',
    };
  }

  const searchObj = {
    user_id: userId,
  };

  if (!isUndefined(isWorked) && isBoolean(isWorked)) {
    searchObj.is_worked = isWorked;
  }

  const userLevelBounds = await UserLevelBound.find(searchObj).exec();

  return {
    status: true,
    result: userLevelBounds.map(bound => bound._doc),
  };
};

module.exports = {
  getUserLevelBounds,
};
