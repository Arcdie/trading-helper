const {
  isUndefined,
} = require('lodash');

const {
  isMongoId,
} = require('validator');

const log = require('../../libs/logger/index')(module);

const {
  createUserNotification,
} = require('./utils/create-user-notification');

module.exports = async (req, res, next) => {
  try {
    const {
      body: {
        price,
        isLong,
        instrumentId,
      },

      user,
    } = req;

    if (!user) {
      return res.json({
        status: false,
        message: 'Not authorized',
      });
    }

    if (!instrumentId || !isMongoId(instrumentId)) {
      return res.json({
        status: false,
        message: 'No or invalid instrumentId',
      });
    }

    if (isUndefined(isLong)) {
      return res.json({
        status: false,
        message: 'No isLong',
      });
    }

    if (isUndefined(price)) {
      return res.json({
        status: false,
        message: 'No price',
      });
    }

    const resultCreate = await createUserNotification({
      instrumentId,
      userId: user._id,

      price,
      isLong,
    });

    if (!resultCreate || !resultCreate.status) {
      const message = resultCreate.message || 'Cant createUserNotification';

      log.warn(message);

      return res.json({
        status: false,
        message,
      });
    }

    return res.json({
      status: true,
    });
  } catch (error) {
    log.error(error.message);

    return res.json({
      status: false,
      message: error.message,
    });
  }
};
