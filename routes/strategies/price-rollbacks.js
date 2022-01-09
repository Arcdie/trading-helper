const router = require('express').Router();

const getUser = require('../../middlewares/get-user');
const getAuthToken = require('../../middlewares/get-auth-token');

const priceRollbackControllers = require('../../controllers/strategies/priceRollbacks');

const commonMiddlewares = [
  getAuthToken,
  getUser,
];

// cron

router.get('/constants', priceRollbackControllers.getConstants);

module.exports = router;
