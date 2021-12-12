const router = require('express').Router();

const getUser = require('../middlewares/get-user');
const getAuthToken = require('../middlewares/get-auth-token');

const webControllers = require('../controllers/web');

const commonMiddlewares = [
  getAuthToken,
];

const extendedMiddlewares = [
  ...commonMiddlewares,
  getUser,
];

router.get('/', commonMiddlewares, webControllers.getMainPage);
router.get('/profile', extendedMiddlewares, webControllers.getProfilePage);

router.get('/utilities', extendedMiddlewares, webControllers.getUtilitiesPage);
router.get('/volume-monitoring', extendedMiddlewares, webControllers.getVolumeMonitoringPage);
router.get('/levels-monitoring', extendedMiddlewares, webControllers.getLevelsMonitoringPage);

router.get('/volume-statistics', extendedMiddlewares, webControllers.getVolumeStatisticsPage);
router.get('/robots-statistics', extendedMiddlewares, webControllers.getRobotsStatisticsPage);

router.get('/experiment', extendedMiddlewares, webControllers.getExperimentPage);

router.get('/auth/login', commonMiddlewares, webControllers.getLoginPage);
router.get('/auth/registration', commonMiddlewares, webControllers.getRegistrationPage);

router.get('/logs/:typeLogs', commonMiddlewares, webControllers.getLogsPage);

router.use('/profit', commonMiddlewares, require('./web-profit'));
router.use('/statistics', commonMiddlewares, require('./web-statistics'));

module.exports = router;
