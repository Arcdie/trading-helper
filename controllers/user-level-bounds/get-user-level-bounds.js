const {
  isMongoId,
} = require('validator');

const log = require('../../libs/logger')(module);

const {
  getUserLevelBounds,
} = require('./utils/get-user-level-bounds');

module.exports = async (req, res, next) => {
  try {
    const {
      query: {
        userId,
        isWorked,
      },
    } = req;

    if (!userId || !isMongoId(userId)) {
      return res.json({
        status: false,
        message: 'No or invalid userId',
      });
    }

    const funcObj = {
      userId,
    };

    if (isWorked) {
      funcObj.isWorked = isWorked === 'true';
    }

    const resultGetBounds = await getUserLevelBounds(funcObj);

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
  } catch (error) {
    log.warn(error.message);

    return res.json({
      status: false,
      message: error.message,
    });
  }
};
