const router = require('express').Router();

const signalControllers = require('../controllers/signals');

router.get('/', signalControllers.getSignalPage);
router.get('/quotes', signalControllers.getListQuotes);
router.get('/instruments', signalControllers.getListInstruments);

module.exports = router;
