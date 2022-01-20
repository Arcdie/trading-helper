const {
  isMongoId,
} = require('validator');

const {
  isUndefined,
} = require('lodash');

const redis = require('../../../libs/redis');
const log = require('../../../libs/logger')(module);

const {
  sendMessage,
} = require('../../../services/telegram-bot');

const User = require('../../../models/User');
const UserNotification = require('../../../models/UserNotification');

const checkUserNotifications = async ({
  instrumentId,
  instrumentName,

  price,
}) => {
  try {
    if (!instrumentId || !isMongoId(instrumentId.toString())) {
      return {
        status: false,
        message: 'No or invalid instrumentId',
      };
    }

    if (!instrumentName) {
      return {
        status: false,
        message: 'No instrumentName',
      };
    }

    if (isUndefined(price)) {
      return {
        status: false,
        message: 'No price',
      };
    }

    const keyInstrumentNotifications = `INSTRUMENT:${instrumentName}:USER_NOTIFICATIONS`;

    const instrumentNotificationKeys = await redis.hkeysAsync(
      keyInstrumentNotifications,
    );

    if (!instrumentNotificationKeys || !instrumentNotificationKeys.length) {
      return {
        status: true,
      };
    }

    const workedKeys = [];

    instrumentNotificationKeys.forEach(key => {
      let [userPrice, isLong] = key.split('_');

      isLong = isLong === 'true';
      userPrice = parseFloat(userPrice);

      if ((isLong && userPrice <= price)
        || (!isLong && userPrice >= price)) {
        workedKeys.push(key);
      }
    });

    if (!workedKeys.length) {
      return {
        status: true,
      };
    }

    const instrumentNotifications = await redis.hmgetAsync(
      keyInstrumentNotifications,
      workedKeys,
    );

    await redis.hdelAsync(
      keyInstrumentNotifications,
      workedKeys,
    );

    if (!instrumentNotifications || !instrumentNotifications.length) {
      return {
        status: true,
      };
    }

    const boundsIds = [];

    instrumentNotifications.forEach(bounds => {
      bounds = JSON.parse(bounds);
      boundsIds.push(...bounds);
    });

    const userNotificationsDocs = await UserNotification.find({
      _id: { $in: boundsIds },
      is_active: true,
    }, {
      user_id: 1,

      price: 1,
      is_long: 1,
    }).exec();

    const usersIds = userNotificationsDocs.map(doc => doc.user_id.toString());

    const usersDocs = await User.find({
      _id: { $in: usersIds },
    }, {
      telegram_user_id: 1,
    }).exec();

    await Promise.all(boundsIds.map(async boundId => {
      const boundDoc = userNotificationsDocs.find(
        doc => doc._id.toString() === boundId,
      );

      const userDoc = usersDocs.find(
        doc => doc._id.toString() === boundDoc.user_id.toString(),
      );

      boundDoc.is_active = false;
      boundDoc.worked_at = new Date();

      await boundDoc.save();

      if (userDoc.telegram_user_id) {
        const message = `Инструмент пересек уровень,
${instrumentName}, ${boundDoc.price}`;

        sendMessage(userDoc.telegram_user_id, message);
      }
    }));

    return {
      status: true,
    };
  } catch (error) {
    log.error(error.message);

    return {
      status: true,
      message: error.message,
    };
  }
};

module.exports = {
  checkUserNotifications,
};
