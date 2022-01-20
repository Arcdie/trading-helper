const {
  isMongoId,
} = require('validator');

const {
  isUndefined,
} = require('lodash');

const redis = require('../../../libs/redis');
const log = require('../../../libs/logger')(module);

const {
  findOne,
} = require('../../instruments/utils/find-one');

const UserNotification = require('../../../models/UserNotification');

const createUserNotification = async ({
  userId,
  instrumentId,

  isLong,
  price,
}) => {
  try {
    if (!userId || !isMongoId(userId.toString())) {
      return {
        status: false,
        message: 'No or invalid userId',
      };
    }

    if (!instrumentId || !isMongoId(instrumentId.toString())) {
      return {
        status: false,
        message: 'No or invalid instrumentId',
      };
    }

    if (isUndefined(isLong)) {
      return {
        status: false,
        message: 'No isLong',
      };
    }

    if (isUndefined(price)) {
      return {
        status: false,
        message: 'No price',
      };
    }

    const resultGetOne = await findOne({
      instrumentId,
    });

    if (!resultGetOne || !resultGetOne.status) {
      return {
        status: false,
        message: resultGetOne.message || 'Cant findOne',
      };
    }

    const doesExistNotification = await UserNotification.exists({
      user_id: userId,
      instrument_id: instrumentId,

      price,
      is_long: isLong,
      is_active: true,
    });

    if (doesExistNotification) {
      return {
        status: true,
        isCreated: false,
      };
    }

    const newNotification = new UserNotification({
      user_id: userId,
      instrument_id: instrumentId,

      price,
      is_long: isLong,
    });

    await newNotification.save();

    const instrumentDoc = resultGetOne.result;
    const validPrice = price.toFixed(instrumentDoc.price_precision);

    const keyPriceSymbol = `${validPrice}_${isLong ? 'long' : 'short'}`;
    const keyInstrumentNotifications = `INSTRUMENT:${instrumentDoc.name}:USER_NOTIFICATIONS`;

    let userNotifications = await redis.hgetAsync(
      keyInstrumentNotifications,
      keyPriceSymbol,
    );

    if (!userNotifications) {
      userNotifications = [];
    } else {
      userNotifications = JSON.parse(userNotifications);
    }

    userNotifications.push(newNotification._id);

    await redis.hsetAsync([
      keyInstrumentNotifications,
      keyPriceSymbol,
      JSON.stringify(userNotifications),
    ]);

    return {
      status: true,
      isCreated: true,
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
  createUserNotification,
};
