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

// cron
router.get('/cron/calculate-user-level-bounds', userLevelBoundCronControllers.calculateUserLevelBounds);

module.exports = router;
