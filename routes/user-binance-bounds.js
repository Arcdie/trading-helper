const router = require('express').Router();

const getUser = require('../middlewares/get-user');
const getAuthToken = require('../middlewares/get-auth-token');

const userBinanceBoundControllers = require('../controllers/user-binance-bounds');

const commonMiddlewares = [
  getAuthToken,
  getUser,
];

router.post('/', commonMiddlewares, userBinanceBoundControllers.createUserBinanceBound);

module.exports = router;
