const router = require('express').Router();

const getUser = require('../middlewares/get-user');
const getAuthToken = require('../middlewares/get-auth-token');

const userLevelBoundControllers = require('../controllers/user-level-bounds');
const userLevelBoundCronControllers = require('../controllers/user-level-bounds/cron');

const commonMiddlewares = [
  getAuthToken,
  getUser,
];

router.get('/', userLevelBoundControllers.getUserLevelBounds);
router.post('/add-levels', commonMiddlewares, userLevelBoundControllers.createUserLevelBounds);

router.post('/add-levels-from-tradingview', commonMiddlewares, userLevelBoundControllers.getLevelsForEveryInstrumentFromTradingView);
router.post('/add-5m-levels-from-tradingview', commonMiddlewares, userLevelBoundControllers.get5mLevelsForEveryInstrumentFromTradingView);
router.post('/add-levels-from-tradingview-for-one-instrument', commonMiddlewares, userLevelBoundControllers.getLevelsForOneInstrumentFromTradingView);

router.post('/remove-all-levels', commonMiddlewares, userLevelBoundControllers.removeAllLevels);
router.post('/remove-level-for-instrument', commonMiddlewares, userLevelBoundControllers.removeLevelForInstrument);
router.post('/remove-levels-for-instrument', commonMiddlewares, userLevelBoundControllers.removeLevelsForInstrument);

// cron
router.get('/calculate-user-level-bounds', userLevelBoundCronControllers.calculateUserLevelBounds);

/* Deprecated
  router.post('/', commonMiddlewares, userLevelBoundControllers.createBound);
*/

module.exports = router;
