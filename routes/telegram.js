const router = require('express').Router();

const getUser = require('../middlewares/get-user');
const getAuthToken = require('../middlewares/get-auth-token');

const telegramControllers = require('../controllers/telegram');

const commonMiddlewares = [
  getAuthToken,
  getUser,
];

router.post('/message', commonMiddlewares, telegramControllers.sendMessage);

module.exports = router;
