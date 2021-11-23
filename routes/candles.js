const router = require('express').Router();

const getUser = require('../middlewares/get-user');
const getAuthToken = require('../middlewares/get-auth-token');

const candleControllers = require('../controllers/candles');
const candleCronControllers = require('../controllers/candles/cron');

const commonMiddlewares = [
  getAuthToken,
  getUser,
];

// cron
router.get('/cron/daily-clear', candleCronControllers.clearCandles);
router.get('/cron/check-candles', candleCronControllers.checkCandles);
router.get('/cron/calculate-candles', candleCronControllers.calculateCandles);
router.get('/cron/create-1m-candles-for-last-hour', candleCronControllers.create1mCandlesForLastHour);

router.get('/:interval', commonMiddlewares, candleControllers.getCandles);

module.exports = router;
