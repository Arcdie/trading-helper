const router = require('express').Router();

const getUser = require('../middlewares/get-user');
const getAuthToken = require('../middlewares/get-auth-token');

const userNotificationControllers = require('../controllers/user-notifications');

const commonMiddlewares = [
  getAuthToken,
  getUser,
];

router.get('/', commonMiddlewares, userNotificationControllers.getUserNotifications);
router.post('/', commonMiddlewares, userNotificationControllers.createUserNotification);

module.exports = router;
