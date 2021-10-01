const TeleBot = require('telebot');

const log = require('../libs/logger');

const {
  telegramConf: {
    secret,
    chatId,
  },
} = require('../config');

// const helperenok = new TeleBot(secret);

const sendMessage = message => {
  // helperenok.sendMessage(chatId, message);
};

module.exports = {
  sendMessage,
};
