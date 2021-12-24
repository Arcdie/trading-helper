const router = require('express').Router();

const getUser = require('../middlewares/get-user');
const getAuthToken = require('../middlewares/get-auth-token');

const fileControllers = require('../controllers/files');

const commonMiddlewares = [
  getAuthToken,
  getUser,
];

router.get('/by-name', commonMiddlewares, fileControllers.getFile);

module.exports = router;
