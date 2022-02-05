const router = require('express').Router();

const getUser = require('../../middlewares/get-user');
const getAuthToken = require('../../middlewares/get-auth-token');

const btcPriceJumpControllers = require('../../controllers/strategies/btcPriceJumps');

const commonMiddlewares = [
  getAuthToken,
  getUser,
];

// cron

// router.get('/constants', levelReboundControllers.getConstants);
// router.get('/report', commonMiddlewares, levelReboundControllers.getReport);

module.exports = router;
