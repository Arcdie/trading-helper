const router = require('express').Router();

const getUser = require('../middlewares/get-user');
const getAuthToken = require('../middlewares/get-auth-token');

const tradingviewControllers = require('../controllers/tradingview');

const commonMiddlewares = [
  getAuthToken,
  getUser,
];

router.get('/lists', commonMiddlewares, tradingviewControllers.getLists);
router.get('/levels', commonMiddlewares, tradingviewControllers.getLevels);
router.get('/token', commonMiddlewares, tradingviewControllers.getJWTToken);
router.get('/instruments', commonMiddlewares, tradingviewControllers.getInstrumentsByListId);

module.exports = router;
