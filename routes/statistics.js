const router = require('express').Router();

const getUser = require('../middlewares/get-user');
const getAuthToken = require('../middlewares/get-auth-token');

const statisticsControllers = require('../controllers/statistics');

const commonMiddlewares = [
  getAuthToken,
  getUser,
];

router.get('/volume-spot', commonMiddlewares, statisticsControllers.getVolumeSpotStatistics);

module.exports = router;
