const router = require('express').Router();

const getUser = require('../middlewares/get-user');
const getAuthToken = require('../middlewares/get-auth-token');

const instrumentControllers = require('../controllers/instruments');

const commonMiddlewares = [
  getAuthToken,
  getUser,
];

router.get('/:id', commonMiddlewares, instrumentControllers.findById);
router.get('/by-names', commonMiddlewares, instrumentControllers.findManyByNames);
router.get('/by-robots', commonMiddlewares, instrumentControllers.getInstrumentsWithActiveRobots);

router.post('/', commonMiddlewares, instrumentControllers.createInstrument);

router.get('/upload-new-instruments-from-binance', commonMiddlewares, instrumentControllers.uploadNewInstrumentsFromBinance);

module.exports = router;
