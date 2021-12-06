const router = require('express').Router();

const getUser = require('../middlewares/get-user');
const getAuthToken = require('../middlewares/get-auth-token');

const binanceControllers = require('../controllers/binance');

const commonMiddlewares = [
  getAuthToken,
  getUser,
];

module.exports = router;
