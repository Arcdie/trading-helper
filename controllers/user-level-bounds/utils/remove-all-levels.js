const {
  isMongoId,
} = require('validator');

const UserLevelBound = require('../../../models/UserLevelBound');

const removeAllLevels = async ({
  userId,
}) => {
  if (!userId || !isMongoId(userId.toString())) {
    return {
      status: false,
      message: 'No or invalid userId',
    };
  }

  await UserLevelBound.deleteMany({
    user_id: userId,
  });

  return {
    status: true,
  };
};

module.exports = {
  removeAllLevels,
};
