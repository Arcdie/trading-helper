const {
  isMongoId,
} = require('validator');

const UserLevelBound = require('../../../models/UserLevelBound');

const getUserLevelBounds = async ({
  userId,
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

  const userLevelBounds = await UserLevelBound.find(searchObj).exec();

  return {
    status: true,
    result: userLevelBounds.map(bound => bound._doc),
  };
};

module.exports = {
  getUserLevelBounds,
};
