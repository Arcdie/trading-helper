const router = require('express').Router();

const getUser = require('../../middlewares/get-user');
const getAuthToken = require('../../middlewares/get-auth-token');

const priceJumpControllers = require('../../controllers/strategies/priceJumps');

const commonMiddlewares = [
  getAuthToken,
  getUser,
];

// cron

router.get('/constants', priceJumpControllers.getConstants);
router.get('/report', commonMiddlewares, priceJumpControllers.getReport);

module.exports = router;
