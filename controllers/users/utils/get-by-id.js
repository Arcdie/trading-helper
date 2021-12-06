const {
  isMongoId,
} = require('validator');

const redis = require('../../../libs/redis');
const log = require('../../../libs/logger')(module);

const User = require('../../../models/User');

const getById = async ({
  userId,
}) => {
  try {
    if (!userId || !isMongoId(userId.toString())) {
      return {
        status: false,
        message: 'No or invalid userId',
      };
    }

    const keyUser = `USER:${userId}`;
    let userDoc = await redis.getAsync(keyUser);

    if (!userDoc) {
      userDoc = await User.findById(userId, {
        password: 0,
      }).exec();

      if (!userDoc) {
        return {
          status: false,
          message: 'No User',
        };
      }

      await redis.setAsync([
        keyUser,
        JSON.stringify(userDoc._doc),
        'EX',
        60 * 60 * 24, // 1 day (in seconds)
      ]);

      userDoc = userDoc._doc;
    } else {
      userDoc = JSON.parse(userDoc);
    }

    return {
      status: true,
      result: userDoc,
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
  getById,
};
