module.exports = {
  app: {
    host: 'localhost',
    url: process.env.APP_URL,
    port: process.env.APP_PORT,
    environment: process.env.NODE_ENV,
  },

  mongodbConf: {
    url: `mongodb+srv://${process.env.MONGODB_LOGIN}:${process.env.MONGODB_PASSWORD}@cluster0.xqo13.mongodb.net/${process.env.MONGODB_DATABASE}?retryWrites=true&w=majority`,
    options: {
      connectTimeoutMS: 30000,
    },
  },
};
