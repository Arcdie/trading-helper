const router = require('express').Router();

const getUser = require('../middlewares/get-user');
const getAuthToken = require('../middlewares/get-auth-token');

const instrumentControllers = require('../controllers/instruments');

const commonMiddlewares = [
  getAuthToken,
  getUser,
];

router.get('/active', commonMiddlewares, instrumentControllers.getActiveInstruments);
router.get('/by-id', commonMiddlewares, instrumentControllers.findManyById);
router.get('/by-name', commonMiddlewares, instrumentControllers.findManyByName);
router.get('/by-robots', commonMiddlewares, instrumentControllers.getInstrumentsWithActiveRobots);

router.post('/', commonMiddlewares, instrumentControllers.createInstrument);

router.get('/upload-new-instruments-from-binance', commonMiddlewares, instrumentControllers.uploadNewInstrumentsFromBinance);

router.get('/:id', commonMiddlewares, instrumentControllers.findOneById);
router.patch('/:id', commonMiddlewares, instrumentControllers.updateInstrument);

module.exports = router;
