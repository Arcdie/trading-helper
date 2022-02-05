// DEPRECATED

const log = require('../../../libs/logger')(module);

const {
  sendMessage,
} = require('../../../services/telegram-bot');

const User = require('../../../models/User');
const UserLevelBound = require('../../../models/UserLevelBound');

const checkCrossing = async ({
  instrumentId,
  instrumentName,

  newPrice,
}) => {
  try {
    const targetBounds = await UserLevelBound.find({
      instrument_id: instrumentId,
      level_timeframe: '4h',
      is_worked: false,
    }).exec();

    await Promise.all(targetBounds.map(async targetBound => {
      let isCrossed = false;

      if (targetBound.is_long
        && targetBound.price_original <= newPrice) {
        isCrossed = true;
      } else if (!targetBound.is_long
        && targetBound.price_original >= newPrice) {
        isCrossed = true;
      }

      if (isCrossed) {
        const userDoc = await User.findById(targetBound.user_id, {
          settings: 1,
          telegram_user_id: 1,
        }).exec();

        if (!userDoc) {
          log.warn('No User');
          return null;
        }

        if (!userDoc.settings) {
          userDoc.settings = {};
        }

        if (userDoc.settings.is_bounded_telegram && userDoc.telegram_user_id) {
          sendMessage(userDoc.telegram_user_id, `${instrumentName}
  Уровень: ${targetBound.price_original} ${targetBound.is_long ? 'long' : 'short'}
  Осталось: Пересекло`);
        }

        targetBound.is_worked = true;
        targetBound.is_sended_in_telegram = true;

        targetBound.worked_at = new Date();

        await targetBound.save();
        return null;
      }

      if (!targetBound.is_sended_in_telegram) {
        let priceWithIndent;
        const percentPerOriginalPrice = targetBound.price_original * (targetBound.indent_in_percents / 100);

        if (targetBound.is_long) {
          priceWithIndent = targetBound.price_original - percentPerOriginalPrice;

          if (priceWithIndent <= newPrice) {
            isCrossed = true;
          }
        } else {
          priceWithIndent = targetBound.price_original + percentPerOriginalPrice;

          if (priceWithIndent >= newPrice) {
            isCrossed = true;
          }
        }

        if (isCrossed) {
          const userDoc = await User.findById(targetBound.user_id, {
            settings: 1,
            telegram_user_id: 1,
          }).exec();

          if (!userDoc) {
            log.warn('No User');
            return null;
          }

          if (!userDoc.settings) {
            userDoc.settings = {};
          }

          if (userDoc.settings.is_bounded_telegram && userDoc.telegram_user_id) {
            const differenceBetweenOrinalPriceAndNewPrice = Math.abs(targetBound.price_original - newPrice);
            const percentPerPrice = 100 / (newPrice / differenceBetweenOrinalPriceAndNewPrice);

            sendMessage(userDoc.telegram_user_id, `${instrumentName}
  Уровень: ${targetBound.price_original} ${targetBound.is_long ? 'long' : 'short'}
  Осталось: ${percentPerPrice.toFixed(2)}%`);
          }

          targetBound.is_sended_in_telegram = true;
          await targetBound.save();
        }
      }
    }));

    return {
      status: true,
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
  checkCrossing,
};
