const router = require('express').Router();

const getUser = require('../../middlewares/get-user');
const getAuthToken = require('../../middlewares/get-auth-token');

const priceReboundControllers = require('../../controllers/strategies/priceRebounds');

const commonMiddlewares = [
  getAuthToken,
  getUser,
];

// cron

router.get('/constants', priceReboundControllers.getConstants);
router.get('/report', commonMiddlewares, priceReboundControllers.getReport);

module.exports = router;
