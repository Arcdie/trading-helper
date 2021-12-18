const router = require('express').Router();

const getUser = require('../../middlewares/get-user');
const getAuthToken = require('../../middlewares/get-auth-token');

const spotVolumeControllers = require('../../controllers/strategies/spot-volumes');

const commonMiddlewares = [
  getAuthToken,
  getUser,
];

// cron

router.get('/constants', spotVolumeControllers.getConstants);

module.exports = router;
