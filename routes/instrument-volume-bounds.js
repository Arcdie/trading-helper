const router = require('express').Router();

const getUser = require('../middlewares/get-user');
const getAuthToken = require('../middlewares/get-auth-token');

const instrumentVolumeBoundControllers = require('../controllers/instrument-volume-bounds');

const commonMiddlewares = [
  getAuthToken,
  getUser,
];

router.get('/', commonMiddlewares, instrumentVolumeBoundControllers.getInstrumentVolumeBounds);

module.exports = router;
