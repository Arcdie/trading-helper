const {
  isMongoId,
} = require('validator');

const User = require('../../../models/User');

const getById = async ({
  userId,
}) => {
  if (!userId || !isMongoId(userId.toString())) {
    return {
      status: false,
      message: 'No or invalid userId',
    };
  }

  const userDoc = await User.findById(userId).exec();

  if (!userDoc) {
    return {
      status: false,
      message: 'No User',
    };
  }

  return {
    status: true,
    result: userDoc._doc,
  };
};

module.exports = {
  getById,
};
