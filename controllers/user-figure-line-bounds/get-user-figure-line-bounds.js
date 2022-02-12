const {
  isUndefined,
} = require('lodash');

const {
  isMongoId,
} = require('validator');

const log = require('../../libs/logger')(module);

const {
  getUserFigureLineBounds,
} = require('./utils/get-user-figure-line-bounds');

module.exports = async (req, res, next) => {
  try {
    const {
      query: {
        userId,
        isWorked,
        isActive,
        isModerated,
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

    if (!isUndefined(isWorked)) {
      funcObj.isWorked = isWorked === 'true';
    }

    if (!isUndefined(isActive)) {
      funcObj.isActive = isActive === 'true';
    }

    if (!isUndefined(isModerated)) {
      funcObj.isModerated = isModerated === 'true';
    }

    const resultGetBounds = await getUserFigureLineBounds(funcObj);

    if (!resultGetBounds || !resultGetBounds.status) {
      return res.json({
        status: true,
        message: resultGetBounds.message || 'Cant getUserFigureLineBounds',
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
