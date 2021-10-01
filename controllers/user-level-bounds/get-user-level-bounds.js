const {
  isMongoId,
} = require('validator');

const {
  getUserLevelBounds,
} = require('./utils/get-user-level-bounds');

const logger = require('../../libs/logger');

const User = require('../../models/User');
const Instrument = require('../../models/Instrument');
const UserLevelBound = require('../../models/UserLevelBound');

module.exports = async (req, res, next) => {
  const {
    user,
  } = req;

  if (!user) {
    return res.json({
      status: false,
      message: 'Not authorized',
    });
  }

  const resultGetBounds = await getUserLevelBounds({
    userId: user._id,
  });

  if (!resultGetBounds || !resultGetBounds.status) {
    return res.json({
      status: true,
      message: resultGetBounds.message || 'Cant getUserLevelBounds',
    });
  }

  return res.json({
    status: true,
    result: resultGetBounds.result,
  });
};
