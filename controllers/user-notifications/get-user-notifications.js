const {
  isMongoId,
} = require('validator');

const log = require('../../libs/logger/index')(module);

const UserNotification = require('../../models/UserNotification');

module.exports = async (req, res, next) => {
  try {
    const {
      query: {
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

    const userNotifications = await UserNotification.find({
      user_id: user._id,
      instrument_id: instrumentId,

      is_active: true,
    }, {
      price: 1,
    }).exec();

    return res.json({
      status: true,
      result: userNotifications.map(doc => doc._doc),
    });
  } catch (error) {
    log.error(error.message);

    return res.json({
      status: false,
      message: error.message,
    });
  }
};
