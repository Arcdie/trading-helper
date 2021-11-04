const router = require('express').Router();

const getUser = require('../middlewares/get-user');
const getAuthToken = require('../middlewares/get-auth-token');

const userControllers = require('../controllers/users');

const commonMiddlewares = [
  getAuthToken,
  getUser,
];

// router.get('/me', commonMiddlewares.getMe);
router.get('/:userid', commonMiddlewares, userControllers.getById);
router.patch('/:userid', commonMiddlewares, userControllers.updateUser);

router.get('/public', userControllers.getPublicData);

router.post('/', userControllers.createUser);
router.post('/login', userControllers.login);

module.exports = router;
