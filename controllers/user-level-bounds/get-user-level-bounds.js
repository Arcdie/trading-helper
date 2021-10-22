const {
  isMongoId,
} = require('validator');

const {
  getUserLevelBounds,
} = require('./utils/get-user-level-bounds');

const logger = require('../../libs/logger');

module.exports = async (req, res, next) => {
  const {
    query: {
      timeframe,
    },

    user,
  } = req;

  if (!user) {
    return res.json({
      status: false,
      message: 'Not authorized',
    });
  }

  if (!timeframe || !['4h', '5m'].includes(timeframe)) {
    return res.json({
      status: false,
      message: 'No or invalid timeframe',
    });
  }

  const resultGetBounds = await getUserLevelBounds({
    userId: user._id,
    timeframe,
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
