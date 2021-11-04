const router = require('express').Router();

const getUser = require('../middlewares/get-user');
const getAuthToken = require('../middlewares/get-auth-token');

const candleControllers = require('../controllers/candles');
const candleCronControllers = require('../controllers/candles/cron');

const commonMiddlewares = [
  getAuthToken,
  getUser,
];

router.get('/daily-clear', candleCronControllers.clearCandles);
router.get('/create-1m-candles-for-last-hour', candleCronControllers.create1mCandlesForLastHour);

router.get('/:interval', commonMiddlewares, candleControllers.getCandles);

// router.get('/:interval/calculate', candleCronControllers.calculateCandles);

module.exports = router;
