const router = require('express').Router();

const getUser = require('../middlewares/get-user');
const getAuthToken = require('../middlewares/get-auth-token');

const instrumentControllers = require('../controllers/instruments');
const instrumentCronControllers = require('../controllers/instruments/cron');

const commonMiddlewares = [
  getAuthToken,
  getUser,
];

router.get('/active', instrumentControllers.getActiveInstruments);
router.post('/by-id', commonMiddlewares, instrumentControllers.findManyById);
router.post('/by-name', commonMiddlewares, instrumentControllers.findManyByName);

router.get('/renew', commonMiddlewares, instrumentControllers.renewInstrumentsInRedis);

router.post('/', commonMiddlewares, instrumentControllers.createInstrument);

router.post('/update-does-ignore-volume', commonMiddlewares, instrumentControllers.updateDoesIgnoreVolume);

// cron
router.get('/cron/update-binance-data', instrumentCronControllers.updateBinanceData);
router.get('/cron/check-inactive-instruments', instrumentCronControllers.checkInactiveInstruments);
router.get('/cron/upload-new-instruments-from-binance', instrumentCronControllers.uploadNewInstrumentsFromBinance);
router.get('/cron/calculate-average-volume-for-last-day', instrumentCronControllers.calculateAverageVolumeForLastDay);
router.get('/cron/calculate-average-volume-for-last-15-minutes', instrumentCronControllers.calculateAverageVolumeForLast15Minutes);

router.get('/:id', commonMiddlewares, instrumentControllers.findOneById);
router.patch('/:id', commonMiddlewares, instrumentControllers.updateInstrument);

module.exports = router;
