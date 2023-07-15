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

router.get('/averaging', extendedMiddlewares, webControllers.getAveragingPage);

router.get('/live', extendedMiddlewares, webControllers.getLiveTradingPage);

router.get('/editor', extendedMiddlewares, webControllers.getEditorPage);
router.get('/figure-lines-editor', extendedMiddlewares, webControllers.getFigureLinesEditorPage);
router.get('/figure-levels-editor', extendedMiddlewares, webControllers.getFigureLevelsEditorPage);

router.get('/levels-monitoring', extendedMiddlewares, webControllers.getLevelsMonitoringPage);
router.get('/figure-lines-monitoring', extendedMiddlewares, webControllers.getFigureLinesMonitoringPage);

router.get('/demo', extendedMiddlewares, webControllers.getTradingDemoPage);
router.get('/trading', extendedMiddlewares, webControllers.getTradingOnlinePage);

router.get('/monitoring', extendedMiddlewares, webControllers.getMonitoringPage);
router.get('/monitoring-correlation', extendedMiddlewares, webControllers.getMonitoringCorrelationPage);

router.get('/volume-statistics', extendedMiddlewares, webControllers.getVolumeStatisticsPage);
router.get('/robots-statistics', extendedMiddlewares, webControllers.getRobotsStatisticsPage);

router.get('/experiment', extendedMiddlewares, webControllers.getExperimentPage);
router.get('/trades-viewer', extendedMiddlewares, webControllers.getTradesViewerPage);

router.get('/auth/login', commonMiddlewares, webControllers.getLoginPage);
router.get('/auth/registration', commonMiddlewares, webControllers.getRegistrationPage);

router.get('/logs/:typeLogs', commonMiddlewares, webControllers.getLogsPage);

router.use('/profit', commonMiddlewares, require('./web-profit'));
router.use('/statistics', commonMiddlewares, require('./web-statistics'));

module.exports = router;
