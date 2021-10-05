const TeleBot = require('telebot');

const log = require('../libs/logger');

const {
  telegramConf: {
    secret,
    chatId,
  },
} = require('../config');

const User = require('../models/User');

let sendMessage = (chatId, message) => {
  log.info(`Send message to telegram; chatId: ${chatId}, message: ${message}`);
};

if (process.env.NODE_ENV !== 'localhost') {
  sendMessage = (chatId, message) => {
    helperenok.sendMessage(chatId, message);
  };

  const helperenok = new TeleBot(secret);

  helperenok.start();
  helperenok.on('/start', msg => {
    sendMessage(msg.from.id, `Привет, ${msg.from.username || 'Пользователь'}. Напиши свой Nickname (логин, которым ты вошел в скринер) 🙂`);
  });

  helperenok.on('text', async msg => {
    if (msg.chat.type === 'private') {
      if (msg.text.toString() === '/start') {
        return true;
      }

      const userDoc = await User.findOne({
        $or: [{
          fullname: msg.text.toString().trim(),
        }, {
          telegram_user_id: msg.from.id,
        }],
      }, {
        settings: 1,
        telegram_user_id: 1,
      }).exec();

      if (!userDoc) {
        sendMessage(msg.from.id, 'На нашел аккаунт с таким Nickname. Попробуй еще раз.');
        return true;
      }

      if (!userDoc.settings) {
        userDoc.settings = {};
      }

      if (userDoc && userDoc.settings.is_bounded_telegram) {
        sendMessage(msg.from.id, 'Аккаунт уже привязан. Больше мне нечего предложить 🙂');
        return true;
      }

      userDoc.telegram_user_id = msg.from.id;
      userDoc.settings.is_bounded_telegram = true;

      await userDoc.save();

      sendMessage(msg.from.id, 'Аккаунт привязан 🙂');
    }
  });
}

module.exports = {
  sendMessage,
};
