const router = require('express').Router();

const getUser = require('../middlewares/get-user');
const getAuthToken = require('../middlewares/get-auth-token');

const candleControllers = require('../controllers/candles');

const commonMiddlewares = [
  getAuthToken,
  getUser,
];

router.get('/', commonMiddlewares, candleControllers.getCandles);

module.exports = router;
