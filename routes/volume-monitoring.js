const router = require('express').Router();

const getUser = require('../middlewares/get-user');
const getAuthToken = require('../middlewares/get-auth-token');

const volumeMonitoringControllers = require('../controllers/volume-monitoring');

const commonMiddlewares = [
  getAuthToken,
  getUser,
];

router.get('/', commonMiddlewares, volumeMonitoringControllers.getAsksAndBidsForInstruments);

module.exports = router;
