const router = require('express').Router();

const getUser = require('../middlewares/get-user');
const getAuthToken = require('../middlewares/get-auth-token');

const userFigureLineBoundControllers = require('../controllers/user-figure-line-bounds');
const userFigureLineBoundCronControllers = require('../controllers/user-figure-line-bounds/cron');

const commonMiddlewares = [
  getAuthToken,
  getUser,
];

router.get('/', userFigureLineBoundControllers.getUserFigureLineBounds);
router.put('/:boundId', commonMiddlewares, userFigureLineBoundControllers.changeUserFigureLineBound);

// cron
router.get('/cron/calculate', userFigureLineBoundCronControllers.calculateUserFigureLineBounds);

module.exports = router;
