const router = require('express').Router();

const getUser = require('../middlewares/get-user');
const getAuthToken = require('../middlewares/get-auth-token');

const userTradeBoundControllers = require('../controllers/user-trade-bounds');

const commonMiddlewares = [
  getAuthToken,
  getUser,
];

router.get('/', commonMiddlewares, userTradeBoundControllers.getUserTradeBounds);

router.post('/for-statistics', userTradeBoundControllers.createUserTradeBoundForStatistics);

module.exports = router;
