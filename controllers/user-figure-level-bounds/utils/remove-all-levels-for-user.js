// DEPRECATED

const {
  isMongoId,
} = require('validator');

const log = require('../../../libs/logger')(module);

const UserLevelBound = require('../../../models/UserLevelBound');

const removeAllLevelsForUser = async ({
  userId,
}) => {
  try {
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
  } catch (error) {
    log.warn(error.message);

    return {
      status: false,
      message: error.message,
    };
  }
};

module.exports = {
  removeAllLevelsForUser,
};
