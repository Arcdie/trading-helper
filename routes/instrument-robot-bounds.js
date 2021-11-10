const router = require('express').Router();

const getUser = require('../middlewares/get-user');
const getAuthToken = require('../middlewares/get-auth-token');

const instrumentRobotBoundControllers = require('../controllers/instrument-robot-bounds');

const commonMiddlewares = [
  getAuthToken,
  getUser,
];

router.post('/', commonMiddlewares, instrumentRobotBoundControllers.createInstrumentRobotBound);

module.exports = router;
