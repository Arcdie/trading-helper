const router = require('express').Router();

const getUser = require('../middlewares/get-user');
const getAuthToken = require('../middlewares/get-auth-token');

const userFigureLevelBoundControllers = require('../controllers/user-figure-level-bounds');
const userFigureLevelBoundCronControllers = require('../controllers/user-figure-level-bounds/cron');

const commonMiddlewares = [
  getAuthToken,
  getUser,
];

router.get('/', userFigureLevelBoundControllers.getUserFigureLevelBounds);
router.post('/', commonMiddlewares, userFigureLevelBoundControllers.createUserFigureLevelBound);
router.post('/remove', commonMiddlewares, userFigureLevelBoundControllers.removeUserFigureLevelBounds);
router.put('/:boundId', commonMiddlewares, userFigureLevelBoundControllers.changeUserFigureLevelBound);

// cron
router.get('/cron/calculate', userFigureLevelBoundCronControllers.calculateUserFigureLevelBounds);

module.exports = router;
