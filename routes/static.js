const router = require('express').Router();

const getUser = require('../middlewares/get-user');
const getAuthToken = require('../middlewares/get-auth-token');

const testControllers = require('../controllers/test');

const commonMiddlewares = [
  getAuthToken,
  getUser,
];

router.use('/', testControllers.getStatic);

module.exports = router;
