const router = require('express').Router();

const getUser = require('../middlewares/get-user');
const getAuthToken = require('../middlewares/get-auth-token');

const instrumentControllers = require('../controllers/instruments');

const commonMiddlewares = [
  getAuthToken,
  getUser,
];

router.get('/by-names', instrumentControllers.findManyByNames);

router.post('/', commonMiddlewares, instrumentControllers.createInstrument);

router.get('/upload-new-instruments-from-binance', commonMiddlewares, instrumentControllers.uploadNewInstrumentsFromBinance);

module.exports = router;
