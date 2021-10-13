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

router.get('/test', extendedMiddlewares, webControllers.getTestPage);

router.get('/levels-monitoring', extendedMiddlewares, webControllers.getLevelsMonitoringPage);
router.get('/levels-monitoring/:timeframe', extendedMiddlewares, webControllers.getLevelsMonitoringPage);

router.get('/auth/login', commonMiddlewares, webControllers.getLoginPage);
router.get('/auth/registration', commonMiddlewares, webControllers.getRegistrationPage);


router.get('/instructions/', commonMiddlewares, webControllers.getRegistrationPage);
router.get('/auth/registration', commonMiddlewares, webControllers.getRegistrationPage);
router.get('/auth/registration', commonMiddlewares, webControllers.getRegistrationPage);

module.exports = router;
