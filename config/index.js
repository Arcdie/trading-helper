module.exports = {
  app: {
    host: 'localhost',
    websocketPort: 3100,
    name: 'trading-helper',
    url: process.env.APP_URL,
    port: process.env.APP_PORT,
    environment: process.env.NODE_ENV,
  },

  mongodbConf: {
    url: `mongodb://${process.env.MONGODB_HOST}:${process.env.MONGODB_PORT}/${process.env.MONGODB_DATABASE}`,
    options: {
      connectTimeoutMS: 30000,
    },
  },

  redisConf: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },

  telegramConf: {
    secret: process.env.TELEGRAM_BOT_SECRET,
    chatId: process.env.TELEGRAM_BOT_CHAT_ID,
  },

  jwtConf: {
    secret: process.env.JWT_SECRET,
    lifetime: (31 * 24 * 60 * 60 * 1000), // 1 month
  },

  clientConf: {
    userId: process.env.CLIENT_USER_ID,
  },

  binanceConf: {
    apikey: process.env.BINANCE_API_KEY,
    secret: process.env.BINANCE_API_SECRET,
  },

  binanceScreenerConf: {
    websocketPort: 3101,
    host: process.env.BINANCE_SCREENER_HOST,
  },
};
