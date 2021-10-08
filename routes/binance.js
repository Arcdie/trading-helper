const router = require('express').Router();

const getUser = require('../middlewares/get-user');
const getAuthToken = require('../middlewares/get-auth-token');

const binanceControllers = require('../controllers/binance');

const commonMiddlewares = [
  getAuthToken,
  getUser,
];

router.post('/save-history-for-instruments', commonMiddlewares, binanceControllers.getAndSaveHistoryForInstruments);

module.exports = router;
