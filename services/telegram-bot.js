const TeleBot = require('telebot');

const {
  telegramConf: {
    secret,
  },
} = require('../config');

const User = require('../models/User');

const helperenok = new TeleBot(secret);

if (process.env.NODE_ENV !== 'localhost') {
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
        telegram_user_id: 1,
      }).exec();

      if (!userDoc) {
        sendMessage(msg.from.id, 'На нашел аккаунт с таким Nickname. Попробуй еще раз.');
        return true;
      }

      userDoc.telegram_user_id = msg.from.id;

      await userDoc.save();

      sendMessage(msg.from.id, 'Аккаунт привязан 🙂');
    }
  });
}

const sendMessage = (chatId, message) => {
  helperenok.sendMessage(chatId, message);
};

module.exports = {
  sendMessage,
};
