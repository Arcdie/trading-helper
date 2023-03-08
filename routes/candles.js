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
router.get('/cron/daily/clear', candleCronControllers.clearCandles); // 00:20
router.get('/cron/daily/check-candles/1m', candleCronControllers.dailyCheck1mCandles);
router.get('/cron/daily/check-candles/5m', candleCronControllers.dailyCheck5mCandles); // 00:30
router.get('/cron/daily/check-candles/1h', candleCronControllers.dailyCheck1hCandles); // 01:00

router.get('/cron/hourly/check-candles/1m', candleCronControllers.hourlyCheck1mCandles);
router.get('/cron/hourly/check-candles/5m', candleCronControllers.hourlyCheck5mCandles); // *:10
router.get('/cron/hourly/check-candles/1h', candleCronControllers.hourlyCheck1hCandles); // *:15

router.get('/cron/calculate-candles', candleCronControllers.calculateCandles);
router.get('/clear-candles-in-redis', commonMiddlewares, candleControllers.clearCandlesInRedis);

router.post('/next-tick', commonMiddlewares, candleControllers.nextTick);

router.get('/:interval', commonMiddlewares, candleControllers.getCandles);

// deprecated
// router.get('/cron/create-1m-candles-for-last-hour', candleCronControllers.create1mCandlesForLastHour);

module.exports = router;
