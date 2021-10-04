const router = require('express').Router();

const getUser = require('../middlewares/get-user');
const getAuthToken = require('../middlewares/get-auth-token');

const userLevelBoundControllers = require('../controllers/user-level-bounds');

const commonMiddlewares = [
  getAuthToken,
  getUser,
];

router.get('/', commonMiddlewares, userLevelBoundControllers.getUserLevelBounds);

router.post('/add-levels-from-tradingview', commonMiddlewares, userLevelBoundControllers.getLevelsForEveryInstrumentFromTradingView);
router.post('/add-levels-from-tradingview-for-one-instrument', commonMiddlewares, userLevelBoundControllers.getLevelsForOneInstrumentFromTradingView);

router.post('/remove-all-levels', commonMiddlewares, userLevelBoundControllers.removeAllLevels);
router.post('/remove-level-for-instrument', commonMiddlewares, userLevelBoundControllers.removeLevelForInstrument);
router.post('/remove-levels-for-instrument', commonMiddlewares, userLevelBoundControllers.removeLevelsForInstrument);

/* Deprecated
  router.post('/', commonMiddlewares, userLevelBoundControllers.createBound);
*/

module.exports = router;
