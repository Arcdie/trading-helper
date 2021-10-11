const router = require('express').Router();

const getUser = require('../middlewares/get-user');
const getAuthToken = require('../middlewares/get-auth-token');

const instrumentTickControllers = require('../controllers/instrument-ticks');

const commonMiddlewares = [
  getAuthToken,
  getUser,
];

router.post('/', commonMiddlewares, instrumentTickControllers.createTick);

module.exports = router;
