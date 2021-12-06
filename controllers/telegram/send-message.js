const {
  isMongoId,
} = require('validator');

const log = require('../../libs/logger')(module);

const {
  sendMessage,
} = require('../../services/telegram-bot');

const User = require('../../models/User');

module.exports = async (req, res, next) => {
  try {
    const {
      body: {
        chatId,
        userId,
        message,
      },

      user,
    } = req;

    if (!user) {
      return res.json({
        status: false,
        message: 'Not authorized',
      });
    }

    if (!message) {
      return res.json({
        status: false,
        message: 'No message',
      });
    }

    if (!chatId && !userId) {
      return res.json({
        status: false,
        message: 'No chatId and userId',
      });
    }

    if (userId && !isMongoId(userId)) {
      return res.json({
        status: false,
        message: 'Invalid userId',
      });
    }

    let userChatId;

    if (chatId) {
      userChatId = chatId;
    } else {
      const userDoc = await User.findById(userId, {
        telegram_user_id: 1,
      }).exec();

      if (!userDoc) {
        return res.json({
          status: false,
          message: 'No User',
        });
      }

      if (!userDoc.telegram_user_id) {
        return res.json({
          status: false,
          message: 'User hasnt bounded his telegram',
        });
      }

      userChatId = userDoc.telegram_user_id;
    }

    sendMessage(userChatId, message);

    return res.json({
      status: true,
    });
  } catch (error) {
    log.warn(error.message);

    return res.json({
      status: false,
      message: error.message,
    });
  }
};
